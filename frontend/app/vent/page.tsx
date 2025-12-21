"use client"

import { useState, useEffect, useRef } from "react"
import { GL } from "@/components/gl"
import { Leva } from "leva"
import { DotFlow, type DotFlowProps } from "@/components/ui/dot-flow"
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from "@/components/ui/chat-input"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { BackendStatus } from "@/components/backend-status"
import { Typewriter } from "@/components/ui/typewriter-text"
import { ConsentBanner } from "@/components/consent-banner"
import { PrivacySettings } from "@/components/privacy-settings"
import { Sidebar } from "@/components/sidebar"
import { RateLimitModal } from "@/components/rate-limit-modal"
import { useAuthApi } from "@/hooks/use-auth-api"

// Calming messages to show while AI is generating response
const calmingMessages = [
  "Take a deep breath...",
  "You're doing great by opening up",
  "Have a sip of water",
  "It's okay to feel this way",
  "You're not alone in this",
  "One moment at a time",
  "Your feelings are valid",
  "Breathe in... breathe out...",
  "You matter more than you know",
  "This too shall pass",
  "Be gentle with yourself",
  "You're stronger than you think",
]

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
    title: "Type freely",
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
    title: "Type freely",
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
    title: "Speak freely",
    frames: micFrames,
    repeatCount: 2,
    duration: 200,
  },
  {
    title: "Speak freely",
    frames: soundWaveFrames,
    repeatCount: 3,
    duration: 120,
  },
]

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function VentPage() {
  const [ventMode, setVentMode] = useState<"text" | "voice" | null>(null)
  const [ventText, setVentText] = useState("")
  const [isReleased, setIsReleased] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [isDayMode, setIsDayMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  
  // Chat continuation state
  const [isChatMode, setIsChatMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  
  // Privacy settings state
  const [showPrivacySettings, setShowPrivacySettings] = useState(false)
  const [showRateLimitModal, setShowRateLimitModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize auth API integration
  useAuthApi()

  // Handle new vent from sidebar
  const handleNewVent = () => {
    setVentText("")
    setIsReleased(false)
    setAiResponse("")
    setVentMode(null)
    setIsRecording(false)
    setRecordingDuration(0)
    setIsChatMode(false)
    setMessages([])
    setChatInput("")
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
        // Check if it's a rate limit error
        if (error.includes("Daily vent limit") || error.includes("limit reached")) {
          setIsReleased(false)
          setShowRateLimitModal(true)
        } else {
          setAiResponse(`Sorry, something went wrong: ${error}`)
        }
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
          // Check if it's a rate limit error
          if (error.includes("Daily vent limit") || error.includes("limit reached")) {
            setIsReleased(false)
            setShowRateLimitModal(true)
          } else {
            setAiResponse(`Sorry, something went wrong: ${error}`)
          }
        },
      )
    }
  }

  const handleAnotherVent = () => {
    console.log("handleAnotherVent called")
    
    // Clear session for fresh start
    try {
      sessionStorage.removeItem("ventvault_session_id")
    } catch (e) {
      console.error("Failed to clear session", e)
    }
    
    // Reset all state
    setVentText("")
    setIsReleased(false)
    setAiResponse("")
    setVentMode(null)
    setIsRecording(false)
    setRecordingDuration(0)
    setIsChatMode(false)
    setMessages([])
    setChatInput("")
    
    console.log("State reset complete, ventMode set to null")
  }

  const handleContinue = () => {
    // Initialize chat with the first exchange
    setMessages([
      { role: "user", content: ventText },
      { role: "assistant", content: aiResponse }
    ])
    setIsChatMode(true)
    setChatInput("")
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return

    const userMessage = chatInput.trim()
    setChatInput("")
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    
    setIsLoading(true)

    // Build conversation context for the API
    const conversationContext = messages
      .map(m => `${m.role === "user" ? "User" : "VentVault"}: ${m.content}`)
      .join("\n\n")
    
    const fullContext = `${conversationContext}\n\nUser: ${userMessage}`

    // Import API client dynamically
    const { streamVent } = await import("@/lib/api-client")

    let assistantResponse = ""

    // Stream response from backend
    await streamVent(
      {
        mode: "text",
        content: fullContext,
      },
      // On each token
      (token) => {
        assistantResponse += token
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage?.role === "assistant" && newMessages.length > messages.length + 1) {
            // Update existing assistant message
            newMessages[newMessages.length - 1] = { role: "assistant", content: assistantResponse }
          } else {
            // Add new assistant message
            newMessages.push({ role: "assistant", content: assistantResponse })
          }
          return newMessages
        })
      },
      // On complete
      () => {
        setIsLoading(false)
      },
      // On error
      (error) => {
        setIsLoading(false)
        // Check if it's a rate limit error
        if (error.includes("Daily vent limit") || error.includes("limit reached")) {
          setShowRateLimitModal(true)
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${error}` }])
        }
      },
    )
  }

  return (
    <>
      <BackendStatus />
      <Leva
        collapsed={true}
        oneLineLabels={true}
        flat={true}
        theme={{
          sizes: {
            rootWidth: "280px",
            controlWidth: "120px",
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
            titleBarHeight: "36px",
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
            root: "11px",
            toolTip: "10px",
          },
          colors: {
            elevation1: "#1a1a1a",
            elevation2: "#222222",
            elevation3: "#2a2a2a",
            accent1: "#FFC700",
            accent2: "#e6b300",
            accent3: "#ccaa00",
            highlight1: "#333333",
            highlight2: "#444444",
            highlight3: "#555555",
            vivid1: "#FFC700",
            folderWidgetColor: "#FFC700",
            folderTextColor: "#e5e5e5",
            toolTipBackground: "#1a1a1a",
            toolTipText: "#e5e5e5",
          },
        }}
        titleBar={{
          position: { x: 0, y: 0 },
          title: "Change Appearance",
        }}
        hideCopyButton={true}
      />
      
      {/* Custom styles to position Leva at bottom right */}
      <style jsx global>{`
        .leva-c-kWgxhW {
          top: auto !important;
          bottom: 20px !important;
          right: 20px !important;
          left: auto !important;
        }
      `}</style>

      <div
        className={`min-h-screen transition-all duration-300 ${
          isChatMode ? "ml-16" : ""
        } ${
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
                  className="text-3xl md:text-4xl lg:text-5xl font-sentient mb-12 transition-colors duration-700"
                  style={{ color: "#FFC700" }}
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
                  <button
                    onClick={() => setVentMode(null)}
                    className={`px-4 py-2 font-mono text-sm tracking-wider rounded-full transition-all duration-300 ${
                      isDayMode
                        ? "text-neutral-600 hover:bg-neutral-200/50"
                        : "text-neutral-400 hover:bg-neutral-800/50"
                    }`}
                  >
                    ← Back
                  </button>
                </div>

                {/* Chat area that grows */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Calming typewriter text in center */}
                  <div className="flex-1 flex items-center justify-center">
                    <Typewriter
                      text={calmingMessages}
                      speed={70}
                      deleteSpeed={35}
                      delay={2500}
                      loop={true}
                      cursor=""
                      className={`text-xl md:text-2xl lg:text-3xl font-sentient text-center transition-colors duration-700 ${
                        isDayMode ? "text-neutral-700" : "text-white"
                      }`}
                    />
                  </div>

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
                  <button
                    onClick={() => setVentMode(null)}
                    className={`px-4 py-2 font-mono text-sm tracking-wider rounded-full transition-all duration-300 ${
                      isDayMode
                        ? "text-neutral-600 hover:bg-neutral-200/50"
                        : "text-neutral-400 hover:bg-neutral-800/50"
                    }`}
                  >
                    ← Back
                  </button>
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

            {isReleased && !isChatMode && (
              <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[50vh]">
                {/* Loading state with calming typewriter */}
                {isLoading && !aiResponse && (
                  <div className="text-center">
                    <Typewriter
                      text={calmingMessages}
                      speed={60}
                      deleteSpeed={30}
                      delay={2000}
                      loop={true}
                      cursor=""
                      className={`text-xl md:text-2xl lg:text-3xl font-sentient transition-colors duration-700 ${
                        isDayMode ? "text-neutral-600" : "text-stone-300"
                      }`}
                    />
                  </div>
                )}

                {/* AI Response */}
                <div
                  className={`w-full transition-opacity duration-1000 ${aiResponse ? "opacity-100" : "opacity-0"}`}
                >
                  <p
                    className={`text-lg md:text-xl leading-relaxed mb-12 transition-colors duration-700 font-sentient whitespace-pre-wrap ${
                      isDayMode ? "text-neutral-700" : "text-stone-200"
                    }`}
                  >
                    {aiResponse}
                  </p>

                  {!isLoading && aiResponse && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                        onClick={handleAnotherVent}
                        className={`px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 ${
                          isDayMode
                            ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                            : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                        }`}
                      >
                        Another vent
                      </button>

                      <button
                        onClick={handleContinue}
                        className={`px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 ${
                          isDayMode
                            ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                            : "border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                        }`}
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Continuation Mode */}
            {isChatMode && (
              <div className="w-full max-w-3xl flex flex-col h-[85vh]">
                {/* Messages area */}
                <div className={`flex-1 overflow-y-auto space-y-6 pb-4 pr-2 ${isDayMode ? "custom-scrollbar-light" : "custom-scrollbar"}`}>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-5 py-4 rounded-2xl transition-all duration-300 ${
                          message.role === "user"
                            ? isDayMode
                              ? "bg-neutral-800 text-white"
                              : "bg-neutral-700 text-white"
                            : isDayMode
                              ? "bg-white/80 text-neutral-700 border border-neutral-200"
                              : "bg-neutral-900/60 text-stone-200 border border-neutral-800"
                        }`}
                      >
                        <p className="text-sm md:text-base leading-relaxed font-sentient whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator with calming typewriter */}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div
                        className={`px-5 py-4 rounded-2xl ${
                          isDayMode
                            ? "bg-white/80 border border-neutral-200"
                            : "bg-neutral-900/60 border border-neutral-800"
                        }`}
                      >
                        <Typewriter
                          text={calmingMessages}
                          speed={50}
                          deleteSpeed={25}
                          delay={1500}
                          loop={true}
                          cursor=""
                          className={`text-sm md:text-base font-sentient ${
                            isDayMode ? "text-neutral-500" : "text-stone-400"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="mt-4">
                  <ChatInput
                    variant="default"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onSubmit={handleSendMessage}
                    loading={isLoading}
                    onStop={() => setIsLoading(false)}
                    rows={2}
                    isDayMode={isDayMode}
                    className={`backdrop-blur-md ${
                      isDayMode ? "shadow-lg shadow-neutral-200/50" : "shadow-xl shadow-black/30"
                    }`}
                  >
                    <ChatInputTextArea placeholder="Continue the conversation..." autoFocus />
                    <ChatInputSubmit />
                  </ChatInput>
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
            <button
              onClick={() => setShowPrivacySettings(true)}
              className={`block mx-auto mt-2 text-xs font-mono transition-colors duration-300 ${
                isDayMode ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              Privacy Settings
            </button>
          </footer>
        </div>
      </div>
      
      {/* Consent Banner */}
      <ConsentBanner />
      
      {/* Privacy Settings Modal */}
      <PrivacySettings
        isOpen={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        isDayMode={isDayMode}
      />

      {/* Sidebar - only show in chat continuation mode */}
      {isChatMode && (
        <Sidebar
          onNewVent={handleNewVent}
          isDayMode={isDayMode}
        />
      )}

      {/* Rate Limit Modal */}
      <RateLimitModal
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        isDayMode={isDayMode}
      />
    </>
  )
}
