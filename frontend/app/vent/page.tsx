"use client"

import { useState, useEffect } from "react"
import { GL } from "@/components/gl"
import { Button } from "@/components/ui/button"
import { Leva } from "leva"
import { DotFlow, type DotFlowProps } from "@/components/ui/dot-flow"
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from "@/components/ui/chat-input"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { BackendStatus } from "@/components/backend-status"

const writingFrames = [
  [0, 2, 4, 6, 20, 34, 48, 46, 44, 42, 28, 14, 8, 22, 36, 38, 40, 26, 12, 10, 16, 30, 24, 18, 32],
  [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47],
  [8, 22, 36, 38, 40, 26, 12, 10, 16, 30, 24, 18, 32],
  [9, 11, 15, 17, 19, 23, 25, 29, 31, 33, 37, 39],
  [16, 30, 24, 18, 32],
  [17, 23, 31, 25],
  [24],
  [17, 23, 31, 25],
  [16, 30, 24, 18, 32],
  [9, 11, 15, 17, 19, 23, 25, 29, 31, 33, 37, 39],
  [8, 22, 36, 38, 40, 26, 12, 10, 16, 30, 24, 18, 32],
]

const typingFrames = [
  [45, 38, 31, 24, 17, 23, 25],
  [38, 31, 24, 17, 10, 16, 18],
  [31, 24, 17, 10, 3, 9, 11],
  [24, 17, 10, 3, 2, 4],
  [17, 10, 3],
  [10, 3],
  [3],
  [],
  [45],
  [45, 38, 44, 46],
  [45, 38, 31, 37, 39],
  [45, 38, 31, 24, 30, 32],
]

const pencilFrames = [
  [9, 16, 17, 15, 23],
  [10, 17, 18, 16, 24],
  [11, 18, 19, 17, 25],
  [18, 25, 26, 24, 32],
  [25, 32, 33, 31, 39],
  [32, 39, 40, 38, 46],
  [31, 38, 39, 37, 45],
  [30, 37, 38, 36, 44],
  [23, 30, 31, 29, 37],
  [31, 29, 37, 22, 24, 23, 38, 36],
  [16, 23, 24, 22, 30],
]

const voiceWaveFrames = [
  [],
  [3],
  [10, 2, 4, 3],
  [17, 9, 1, 11, 5, 10, 4, 3, 2],
  [24, 16, 8, 1, 3, 5, 18, 12, 17, 11, 4, 10, 9, 2],
  [31, 23, 15, 8, 10, 2, 4, 12, 25, 19, 24, 18, 11, 17, 16, 9],
  [38, 30, 22, 15, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16],
  [38, 30, 22, 15, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16],
  [38, 30, 22, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16, 45, 37, 29, 21, 14, 8, 15, 12, 20, 27, 33, 39],
  [38, 30, 22, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16, 45, 37, 29, 21, 14, 8, 15, 12, 20, 27, 33, 39],
  [38, 30, 22, 15, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16],
  [38, 30, 22, 15, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16],
  [38, 30, 22, 17, 9, 11, 19, 32, 26, 31, 25, 18, 24, 23, 16, 45, 37, 29, 21, 14, 8, 15, 12, 20, 27, 33, 39],
  [39, 33, 37, 29, 17, 38, 30, 22, 15, 16, 23, 24, 31, 32, 25, 18, 26, 19],
  [17, 30, 16, 23, 24, 31, 32, 25, 18],
  [24],
]

const micFrames = [
  [],
  [7, 1],
  [15, 9, 7, 1],
  [23, 17, 21, 15, 9, 3],
  [31, 25, 29, 23, 17, 11],
  [39, 33, 37, 31, 25, 19],
  [47, 41, 45, 39, 33, 27],
  [47, 41, 45, 39, 33, 27],
  [47, 41, 45, 39, 33, 27],
  [47, 41, 45, 39, 33, 27],
]

const soundWaveFrames = [
  [21, 22, 23, 24, 25, 26, 27],
  [14, 15, 16, 17, 18, 19, 20, 28, 29, 30, 31, 32, 33, 34],
  [7, 8, 9, 10, 11, 12, 13, 35, 36, 37, 38, 39, 40, 41],
  [0, 1, 2, 3, 4, 5, 6, 42, 43, 44, 45, 46, 47, 48],
  [7, 8, 9, 10, 11, 12, 13, 35, 36, 37, 38, 39, 40, 41],
  [14, 15, 16, 17, 18, 19, 20, 28, 29, 30, 31, 32, 33, 34],
  [21, 22, 23, 24, 25, 26, 27],
]

const textVentItems: DotFlowProps["items"] = [
  {
    title: "Write it out",
    frames: writingFrames,
    duration: 180,
    repeatCount: 1,
  },
  {
    title: "Type freely",
    frames: typingFrames,
    repeatCount: 2,
    duration: 100,
  },
  {
    title: "Let words flow",
    frames: pencilFrames,
    repeatCount: 2,
    duration: 150,
  },
]

const voiceVentItems: DotFlowProps["items"] = [
  {
    title: "Speak freely",
    frames: voiceWaveFrames,
    duration: 150,
    repeatCount: 1,
  },
  {
    title: "Let it out",
    frames: micFrames,
    repeatCount: 2,
    duration: 200,
  },
  {
    title: "Your voice matters",
    frames: soundWaveFrames,
    repeatCount: 3,
    duration: 120,
  },
]

export default function VentPage() {
  const [ventMode, setVentMode] = useState<"choice" | "text" | "voice" | null>(null)
  const [ventText, setVentText] = useState("")
  const [isReleased, setIsReleased] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [isDayMode, setIsDayMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours()
      setIsDayMode(hour >= 6 && hour < 19)
    }

    checkTime()
    const interval = setInterval(checkTime, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleRelease = async () => {
    if (!ventText.trim()) return

    setIsLoading(true)
    setIsReleased(true)
    setAiResponse("")

    // Import API client dynamically
    const { streamVent } = await import("@/lib/api-client")

    // Stream response from backend
    await streamVent(
      {
        mode: "text",
        content: ventText,
      },
      // On each token
      (token) => {
        setAiResponse((prev) => prev + token)
      },
      // On complete
      (metadata) => {
        setIsLoading(false)
        console.log("Session ID:", metadata.sessionId)
        console.log("Remaining vents:", metadata.remainingVents)
      },
      // On error
      (error) => {
        setIsLoading(false)
        setAiResponse(`Sorry, something went wrong: ${error}`)
      },
    )
  }

  const handleVoiceStart = () => {
    setIsRecording(true)
  }

  const handleVoiceStop = async (duration: number) => {
    setIsRecording(false)
    setRecordingDuration(duration)

    if (duration > 0) {
      setIsLoading(true)
      setIsReleased(true)
      setAiResponse("")

      // Import API client dynamically
      const { streamVent } = await import("@/lib/api-client")

      // For voice, we'll send a placeholder until we implement actual transcription
      const voiceContent = `[Voice vent recorded for ${duration.toFixed(1)} seconds]`

      // Stream response from backend
      await streamVent(
        {
          mode: "voice",
          content: voiceContent,
        },
        // On each token
        (token) => {
          setAiResponse((prev) => prev + token)
        },
        // On complete
        (metadata) => {
          setIsLoading(false)
          console.log("Session ID:", metadata.sessionId)
          console.log("Remaining vents:", metadata.remainingVents)
        },
        // On error
        (error) => {
          setIsLoading(false)
          setAiResponse(`Sorry, something went wrong: ${error}`)
        },
      )
    }
  }

  const handleAnotherVent = () => {
    setVentText("")
    setIsReleased(false)
    setAiResponse("")
    setVentMode(null)
    setIsRecording(false)
    setRecordingDuration(0)
  }

  return (
    <>
      <BackendStatus />
      <Leva
        collapsed={false}
        oneLineLabels={true}
        flat={true}
        theme={{
          sizes: {
            rootWidth: "240px",
            controlWidth: "100px",
            scrubberWidth: "8px",
            scrubberHeight: "14px",
            rowHeight: "24px",
            folderTitleHeight: "24px",
            checkboxSize: "14px",
            joystickWidth: "80px",
            joystickHeight: "80px",
            colorPickerWidth: "140px",
            colorPickerHeight: "100px",
            monitorHeight: "40px",
            titleBarHeight: "32px",
          },
          radii: {
            xs: "4px",
            sm: "6px",
            lg: "16px",
          },
          space: {
            xs: "4px",
            sm: "6px",
            md: "8px",
            rowGap: "4px",
            colGap: "4px",
          },
          fontSizes: {
            root: "10px",
            toolTip: "10px",
          },
          colors: {
            elevation1: "#1a1a1a",
            elevation2: "#222222",
            elevation3: "#2a2a2a",
            accent1: "#D4AF37",
            accent2: "#c9a432",
            accent3: "#bfa02e",
            highlight1: "#333333",
            highlight2: "#444444",
            highlight3: "#555555",
            vivid1: "#D4AF37",
            folderWidgetColor: "#D4AF37",
            folderTextColor: "#e5e5e5",
            toolTipBackground: "#1a1a1a",
            toolTipText: "#e5e5e5",
          },
        }}
        titleBar={{
          position: { x: -10, y: 50 },
          title: "Particles",
        }}
      />

      <div
        className={`min-h-screen transition-colors duration-700 ${
          isDayMode
            ? "bg-gradient-to-br from-stone-50 via-stone-100 to-neutral-100"
            : "bg-gradient-to-br from-black via-slate-950 to-neutral-900"
        }`}
      >
        <GL hovering={false} />

        <div className="relative z-10 min-h-screen flex flex-col">
          <main className="flex-1 flex items-center justify-center px-4 pt-12">
            {!ventMode && (
              <div className="text-center space-y-12">
                <h1
                  className={`text-3xl md:text-4xl lg:text-5xl font-sentient mb-12 transition-colors duration-700 ${
                    isDayMode ? "text-neutral-800" : "text-stone-100"
                  }`}
                >
                  How would you like to <i className="font-light">vent</i>?
                </h1>

                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                  <button
                    onClick={() => setVentMode("text")}
                    className="group transition-all duration-300 hover:scale-105"
                  >
                    <DotFlow items={textVentItems} isDayMode={isDayMode} />
                  </button>

                  <button
                    onClick={() => setVentMode("voice")}
                    className="group transition-all duration-300 hover:scale-105"
                  >
                    <DotFlow items={voiceVentItems} isDayMode={isDayMode} />
                  </button>
                </div>
              </div>
            )}

            {ventMode === "text" && !isReleased && (
              <div className="w-full max-w-3xl flex flex-col h-[70vh]">
                {/* Back button */}
                <div className="mb-6">
                  <Button
                    onClick={() => setVentMode("choice")}
                    variant="ghost"
                    className={`px-4 py-2 font-mono text-sm tracking-wider rounded-full transition-all duration-300 ${
                      isDayMode
                        ? "text-neutral-600 hover:bg-neutral-200/50"
                        : "text-neutral-400 hover:bg-neutral-800/50"
                    }`}
                  >
                    ← Back
                  </Button>
                </div>

                {/* Chat area that grows */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Messages would go here in future */}
                  <div className="flex-1" />

                  {/* Chat Input at bottom */}
                  <ChatInput
                    variant="default"
                    value={ventText}
                    onChange={(e) => setVentText(e.target.value)}
                    onSubmit={handleRelease}
                    loading={isLoading}
                    onStop={() => setIsLoading(false)}
                    rows={3}
                    isDayMode={isDayMode}
                    className={`backdrop-blur-md ${
                      isDayMode ? "shadow-lg shadow-neutral-200/50" : "shadow-xl shadow-black/30"
                    }`}
                  >
                    <ChatInputTextArea placeholder="Type freely. This isn't being judged..." autoFocus />
                    <ChatInputSubmit />
                  </ChatInput>
                </div>
              </div>
            )}

            {ventMode === "voice" && !isReleased && (
              <div className="w-full max-w-xl flex flex-col items-center">
                {/* Back button */}
                <div className="w-full mb-8">
                  <Button
                    onClick={() => setVentMode(null)}
                    variant="ghost"
                    className={`px-4 py-2 font-mono text-sm tracking-wider rounded-full transition-all duration-300 ${
                      isDayMode
                        ? "text-neutral-600 hover:bg-neutral-200/50"
                        : "text-neutral-400 hover:bg-neutral-800/50"
                    }`}
                  >
                    ← Back
                  </Button>
                </div>

                {/* Title */}
                <h2
                  className={`text-2xl md:text-3xl font-sentient mb-8 text-center transition-colors duration-700 ${
                    isDayMode ? "text-neutral-800" : "text-stone-100"
                  }`}
                >
                  Speak your mind
                </h2>

                {/* Voice Input Component */}
                <div
                  className={`w-full max-w-md p-8 rounded-3xl backdrop-blur-md transition-all duration-500 ${
                    isDayMode
                      ? "bg-white/60 shadow-lg shadow-neutral-200/50"
                      : "bg-neutral-900/40 shadow-xl shadow-black/30 border border-neutral-800/50"
                  }`}
                >
                  <AIVoiceInput
                    onStart={handleVoiceStart}
                    onStop={handleVoiceStop}
                    visualizerBars={48}
                    isDayMode={isDayMode}
                  />
                </div>

                {/* Helper text */}
                <p
                  className={`mt-6 text-sm font-mono transition-colors duration-700 ${
                    isDayMode ? "text-neutral-500" : "text-neutral-500"
                  }`}
                >
                  {isRecording ? "Recording... click to stop" : "Your voice stays with you"}
                </p>
              </div>
            )}

            {isReleased && (
              <div
                className={`w-full max-w-2xl transition-opacity duration-1000 ${aiResponse ? "opacity-100" : "opacity-0"}`}
              >
                <p
                  className={`text-lg md:text-xl leading-relaxed mb-12 transition-colors duration-700 font-sentient ${
                    isDayMode ? "text-neutral-700" : "text-stone-200"
                  }`}
                >
                  {aiResponse}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={handleAnotherVent}
                    variant="outline"
                    className={`px-8 py-3 font-mono text-sm tracking-wider rounded-full transition-all duration-300 ${
                      isDayMode
                        ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                        : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    Another vent
                  </Button>

                  <Button
                    onClick={() => {}}
                    variant="outline"
                    className={`px-8 py-3 font-mono text-sm tracking-wider rounded-full transition-all duration-300 ${
                      isDayMode
                        ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                        : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </main>

          <footer className="pb-8">
            <p
              className={`text-center text-sm font-mono transition-colors duration-700 ${
                isDayMode ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              Nothing is saved unless you choose.
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
