"use client"

import { useState, useEffect } from "react"

export interface DotFlowProps {
  items: {
    title: string
    frames: number[][]
    duration: number
    repeatCount: number
  }[]
  isDayMode?: boolean
}

export function DotFlow({ items, isDayMode = false }: DotFlowProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [repeatCounter, setRepeatCounter] = useState(0)

  const currentItem = items[currentItemIndex]
  const activeDots = currentItem.frames[currentFrameIndex] || []

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        const nextFrame = prev + 1
        if (nextFrame >= currentItem.frames.length) {
          setRepeatCounter((count) => {
            const nextCount = count + 1
            if (nextCount >= currentItem.repeatCount) {
              setCurrentItemIndex((itemIdx) => (itemIdx + 1) % items.length)
              setRepeatCounter(0)
              return 0
            }
            return nextCount
          })
          return 0
        }
        return nextFrame
      })
    }, currentItem.duration)

    return () => clearInterval(timer)
  }, [currentItem, items.length])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 49 }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: activeDots.includes(i) ? "#FFC700" : (isDayMode ? "#d4d4d4" : "#404040"),
              boxShadow: activeDots.includes(i) ? "0 0 8px rgba(255, 199, 0, 0.6)" : "none",
              transform: activeDots.includes(i) ? "scale(1.1)" : "scale(1)",
            }}
            className="w-3 h-3 rounded-full transition-all duration-200"
          />
        ))}
      </div>
      <p
        className={`text-lg font-mono transition-colors duration-700 ${
          isDayMode ? "text-neutral-700" : "text-neutral-300"
        }`}
      >
        {currentItem.title}
      </p>
    </div>
  )
}
