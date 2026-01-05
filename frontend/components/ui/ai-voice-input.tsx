"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mic, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAssemblyToken } from "@/lib/api-client"

// Privacy-reassuring messages shown while recording
const privacyMessages = [
  "Your voice stays with you",
  "Nothing is stored without your choice",
  "Privacy first, always",
  "Your words, your space",
  "Speaking to be heard, not recorded",
  "Safe space to let it out",
]

interface AIVoiceInputProps {
  onStart?: () => void
  onStop?: (duration: number) => void
  onTranscript?: (text: string) => void
  onPartialTranscript?: (text: string) => void
  onError?: (error: string) => void
  visualizerBars?: number
  isDayMode?: boolean
}

// SpeechRecognition type for browsers
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : never

export function AIVoiceInput({
  onStart,
  onStop,
  onTranscript,
  onPartialTranscript,
  onError,
  visualizerBars = 48,
  isDayMode = false,
}: AIVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(visualizerBars).fill(0))
  const [privacyMessage, setPrivacyMessage] = useState(privacyMessages[0])
  const [transcript, setTranscript] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Rotate privacy messages
  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setPrivacyMessage(privacyMessages[Math.floor(Math.random() * privacyMessages.length)])
    }, 4000)

    return () => clearInterval(interval)
  }, [isRecording])

  // Animate audio levels based on actual audio input
  const animateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Create visualizer levels from frequency data
    const newLevels = []
    const barCount = visualizerBars
    const step = Math.floor(dataArray.length / barCount)

    for (let i = 0; i < barCount; i++) {
      const start = i * step
      let sum = 0
      for (let j = 0; j < step; j++) {
        sum += dataArray[start + j] || 0
      }
      const average = sum / step / 255
      newLevels.push(average)
    }

    setAudioLevels(newLevels)
    animationFrameRef.current = requestAnimationFrame(animateAudioLevels)
  }, [visualizerBars])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (socketRef.current) {
        socketRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Try AssemblyAI first, fall back to browser SpeechRecognition
  const startRecording = async () => {
    setIsConnecting(true)
    setTranscript("")

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start visualization
      animateAudioLevels()

      // Use browser SpeechRecognition (works well and is privacy-friendly - processes locally)
      startBrowserRecognition()

      startTimeRef.current = Date.now()
      setIsRecording(true)
      setIsConnecting(false)
      onStart?.()
    } catch (error) {
      setIsConnecting(false)
      console.error("Failed to start recording:", error)
      onError?.("Could not access microphone. Please allow microphone access.")
    }
  }

  const startAssemblyAI = async (stream: MediaStream, token: string) => {
    return new Promise<void>((resolve, reject) => {
      // Use the new v3 Universal Streaming WebSocket endpoint
      const socket = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?token=${token}&sample_rate=16000&format_turns=true`
      )
      socketRef.current = socket

      socket.onopen = () => {
        console.log("AssemblyAI v3 WebSocket connected")

        // Set up MediaRecorder to send audio chunks
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        })
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            // Convert to base64 and send
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1]
              socket.send(JSON.stringify({ audio_data: base64 }))
            }
            reader.readAsDataURL(event.data)
          }
        }

        mediaRecorder.start(250) // Send chunks every 250ms
        resolve()
      }

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data)

        // Handle v3 message types
        if (data.type === "Turn" && data.transcript) {
          // Turn event contains the transcript
          if (data.end_of_turn) {
            // Final transcript for this turn
            setTranscript((prev) => {
              const newTranscript = prev ? `${prev} ${data.transcript}` : data.transcript
              return newTranscript
            })
          } else {
            // Partial transcript
            onPartialTranscript?.(data.transcript)
            setTranscript(data.transcript)
          }
        } else if (data.type === "Begin") {
          console.log("AssemblyAI session started:", data.id)
        } else if (data.type === "Termination") {
          console.log("AssemblyAI session ended")
        }
      }

      socket.onerror = (error) => {
        console.error("AssemblyAI WebSocket error:", error)
        reject(error)
      }

      socket.onclose = () => {
        console.log("AssemblyAI WebSocket closed")
      }
    })
  }

  const startBrowserRecognition = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      onError?.("Voice input is not supported in this browser. Try Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript))
      }
      if (interimTranscript) {
        onPartialTranscript?.(interimTranscript)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      if (event.error !== "aborted") {
        onError?.(`Voice recognition error: ${event.error}`)
      }
    }

    recognition.start()
  }

  const stopRecording = () => {
    const duration = (Date.now() - startTimeRef.current) / 1000

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    // Stop browser recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setAudioLevels(Array(visualizerBars).fill(0))
    setIsRecording(false)

    // Return the transcript
    onStop?.(duration)
    if (transcript.trim()) {
      onTranscript?.(transcript.trim())
    }
  }

  const handleToggle = () => {
    if (!isRecording) {
      startRecording()
    } else {
      stopRecording()
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Live transcript preview */}
      {isRecording && transcript && (
        <div
          className={cn(
            "w-full max-w-md px-4 py-3 rounded-xl text-center font-sentient text-sm leading-relaxed transition-all duration-300",
            isDayMode ? "bg-neutral-100 text-neutral-700" : "bg-neutral-800/50 text-neutral-300"
          )}
        >
          {transcript}
        </div>
      )}

      {/* Visualizer */}
      <div className="flex items-center justify-center gap-0.5 h-24">
        {audioLevels.map((level, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-75 bg-primary"
            style={{
              height: `${Math.max(4, level * 80)}px`,
              opacity: isRecording ? 0.3 + level * 0.7 : 0.2,
            }}
          />
        ))}
      </div>

      {/* Record Button - Golden yellow is VentVault's signature color */}
      <button
        onClick={handleToggle}
        disabled={isConnecting}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          isConnecting && "opacity-50 cursor-wait",
          isRecording
            ? "bg-red-500 hover:bg-red-600 scale-110"
            : "bg-primary hover:bg-primary/80"
        )}
      >
        {isRecording ? (
          <Square className="h-8 w-8 text-neutral-900" />
        ) : (
          <Mic className="h-8 w-8 text-neutral-900" />
        )}
      </button>

      {/* Privacy message */}
      <p
        className={cn(
          "text-sm font-mono transition-all duration-500",
          isDayMode ? "text-neutral-600" : "text-neutral-400"
        )}
      >
        {isConnecting ? "Connecting..." : isRecording ? privacyMessage : "Tap to speak"}
      </p>
    </div>
  )
}
