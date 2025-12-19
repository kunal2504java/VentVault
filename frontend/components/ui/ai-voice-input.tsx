"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIVoiceInputProps {
  onStart?: () => void
  onStop?: (duration: number) => void
  visualizerBars?: number
  isDayMode?: boolean
}

export function AIVoiceInput({ onStart, onStop, visualizerBars = 48, isDayMode = false }: AIVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(visualizerBars).fill(0))
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        setAudioLevels((prev) =>
          prev.map(() => {
            const random = Math.random()
            return random > 0.7 ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3
          }),
        )
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setAudioLevels(Array(visualizerBars).fill(0))
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRecording, visualizerBars])

  const handleToggle = () => {
    if (!isRecording) {
      startTimeRef.current = Date.now()
      setIsRecording(true)
      onStart?.()
    } else {
      const duration = (Date.now() - startTimeRef.current) / 1000
      setIsRecording(false)
      onStop?.(duration)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Visualizer */}
      <div className="flex items-center justify-center gap-1 h-24">
        {audioLevels.map((level, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-100",
              isDayMode ? "bg-neutral-700" : "bg-primary",
            )}
            style={{
              height: `${Math.max(4, level * 80)}px`,
              opacity: isRecording ? 0.3 + level * 0.7 : 0.2,
            }}
          />
        ))}
      </div>

      {/* Record Button */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          isRecording
            ? isDayMode
              ? "bg-red-500 hover:bg-red-600 scale-110"
              : "bg-red-500 hover:bg-red-600 scale-110"
            : isDayMode
              ? "bg-neutral-800 hover:bg-neutral-700"
              : "bg-primary hover:bg-primary/80",
        )}
      >
        {isRecording ? <Square className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white" />}
      </button>
    </div>
  )
}
