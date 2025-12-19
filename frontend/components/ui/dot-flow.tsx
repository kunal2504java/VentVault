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
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              activeDots.includes(i)
                ? isDayMode
                  ? "bg-neutral-800 scale-110"
                  : "bg-primary scale-110"
                : isDayMode
                  ? "bg-neutral-300"
                  : "bg-neutral-800"
            }`}
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
