"use client"

import { useState, useEffect } from "react"
import { GL } from "@/components/gl"
import Link from "next/link"

// Emotion colors - calm and muted but distinct
const emotionColors = {
  sadness: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-300", accent: "#60a5fa" },
  anxiety: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-300", accent: "#fbbf24" },
  anger: { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-300", accent: "#f87171" },
  loneliness: { bg: "bg-violet-500/20", border: "border-violet-500/30", text: "text-violet-300", accent: "#a78bfa" },
  stress: { bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-300", accent: "#fb923c" },
  grief: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-300", accent: "#94a3b8" },
  confusion: { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-300", accent: "#22d3ee" },
  frustration: { bg: "bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-300", accent: "#fb7185" },
  fear: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-300", accent: "#c084fc" },
  relief: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-300", accent: "#34d399" },
}

// Mock data - in production this would come from backend
const mockEmotionData = [
  { emotion: "anxiety", count: 5, percentage: 35 },
  { emotion: "stress", count: 3, percentage: 21 },
  { emotion: "sadness", count: 2, percentage: 14 },
  { emotion: "confusion", count: 2, percentage: 14 },
  { emotion: "relief", count: 2, percentage: 16 },
]

const mockTimeData = {
  mostActiveDay: "Tuesday",
  mostActiveTime: "10 PM",
  timeOfDayLabel: "Night owl",
}

const mockInsight = {
  type: "Resilient One",
  description: "You tend to process emotions internally and release them in focused moments.",
}

export default function MoodMapPage() {
  const [isDayMode, setIsDayMode] = useState(false)

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours()
      setIsDayMode(hour >= 6 && hour < 19)
    }
    checkTime()
    const interval = setInterval(checkTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`min-h-screen transition-all duration-700 ${isDayMode
        ? "bg-gradient-to-br from-stone-50 via-amber-50/30 to-neutral-100"
        : "bg-gradient-to-br from-neutral-950 via-neutral-900 to-stone-950"
        }`}
    >
      <GL hovering={false} />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="pt-16 pb-8 px-6 text-center max-w-4xl mx-auto">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-sentient italic font-light mb-4 transition-colors duration-700"
            style={{ color: "#FFC700" }}
          >
            Your Mood Map
          </h1>
          <p
            className={`text-sm md:text-base font-mono transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-neutral-400"
              }`}
          >
            Patterns, not memories. This is built from signals, not stored content.
          </p>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-16 max-w-5xl mx-auto">
          {/* Emotion Distribution Section */}
          <section className="mb-16">
            <h2
              className={`text-sm font-mono mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-600" : "text-neutral-400"
                }`}
            >
              Emotional Signals Noticed
            </h2>

            <div className="grid gap-3">
              {mockEmotionData.map((item) => {
                const colors = emotionColors[item.emotion as keyof typeof emotionColors] || emotionColors.relief
                return (
                  <div
                    key={item.emotion}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${isDayMode
                      ? "bg-white/60 border-neutral-200 hover:border-neutral-300"
                      : `${colors.bg} ${colors.border} hover:border-opacity-50`
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Color indicator */}
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors.accent }}
                        />
                        <span
                          className={`font-mono text-sm capitalize ${isDayMode ? "text-neutral-700" : colors.text
                            }`}
                        >
                          {item.emotion}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-xs ${isDayMode ? "text-neutral-500" : "text-neutral-400"
                          }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div
                      className={`mt-3 h-1 rounded-full overflow-hidden ${isDayMode ? "bg-neutral-200" : "bg-neutral-800"
                        }`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: colors.accent,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Two Column Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {/* When You Tend to Vent */}
            <section
              className={`p-6 rounded-2xl border transition-all duration-300 ${isDayMode
                ? "bg-white/60 border-neutral-200"
                : "bg-neutral-900/40 border-neutral-800"
                }`}
            >
              <h3
                className={`text-xs font-mono mb-4 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-amber-200/70"
                  }`}
              >
                When You Tend to Vent
              </h3>
              <div
                className={`text-2xl md:text-3xl font-sentient mb-2 transition-colors duration-700 ${isDayMode ? "text-neutral-800" : "text-white"
                  }`}
              >
                {mockTimeData.mostActiveDay}, {mockTimeData.mostActiveTime}
              </div>
              <p
                className={`text-sm font-mono transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-neutral-400"
                  }`}
              >
                You are a {mockTimeData.timeOfDayLabel.toLowerCase()}.
              </p>

              {/* Time visualization - soft dots */}
              <div className="mt-6 grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const isActive = [1, 3, 4, 7, 8, 9, 10, 11, 14, 15, 18, 22, 25, 26].includes(i)
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded transition-all duration-300 ${isActive
                        ? isDayMode
                          ? "bg-amber-400/60"
                          : "bg-amber-500/50"
                        : isDayMode
                          ? "bg-neutral-200"
                          : "bg-neutral-800"
                        }`}
                    />
                  )
                })}
              </div>
            </section>

            {/* Your Emotional Style */}
            <section
              className={`p-6 rounded-2xl border transition-all duration-300 ${isDayMode
                ? "bg-white/60 border-neutral-200"
                : "bg-neutral-900/40 border-neutral-800"
                }`}
            >
              <h3
                className={`text-xs font-mono mb-4 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-amber-200/70"
                  }`}
              >
                Your Emotional Style
              </h3>
              <div className="flex items-center gap-4 mb-4">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${isDayMode ? "bg-neutral-900 text-white" : "bg-white/10 text-white"
                    }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="w-6 h-6"
                  >
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <div>
                  <p
                    className={`text-xs font-mono uppercase tracking-wider ${isDayMode ? "text-neutral-400" : "text-neutral-500"
                      }`}
                  >
                    You are a
                  </p>
                  <h4
                    className={`text-xl font-sentient ${isDayMode ? "text-neutral-800" : "text-white"
                      }`}
                  >
                    {mockInsight.type}
                  </h4>
                </div>
              </div>
              <p
                className={`text-sm font-mono leading-relaxed ${isDayMode ? "text-neutral-500" : "text-neutral-400"
                  }`}
              >
                {mockInsight.description}
              </p>
            </section>
          </div>

          {/* Most Felt Emotion */}
          <section
            className={`p-8 rounded-3xl mb-16 text-center transition-all duration-300 ${isDayMode
              ? "bg-gradient-to-br from-amber-100/80 via-rose-100/60 to-violet-100/80 border border-amber-200/50"
              : "bg-gradient-to-br from-amber-900/20 via-rose-900/20 to-violet-900/20 border border-amber-700/20"
              }`}
          >
            <p
              className={`text-xs font-mono uppercase tracking-wider mb-2 ${isDayMode ? "text-neutral-500" : "text-neutral-400"
                }`}
            >
              Most Felt Emotion
            </p>
            <h3
              className={`text-4xl md:text-5xl font-sentient italic mb-4 capitalize ${isDayMode ? "text-neutral-800" : "text-white"
                }`}
            >
              {mockEmotionData[0].emotion}
            </h3>
            <p
              className={`text-sm font-mono ${isDayMode ? "text-neutral-500" : "text-neutral-400"
                }`}
            >
              Appeared in {mockEmotionData[0].percentage}% of your check-ins.
            </p>
          </section>

          {/* Privacy Reminder */}
          <section className="text-center mb-12">
            <p
              className={`text-xs font-mono ${isDayMode ? "text-neutral-400" : "text-neutral-600"
                }`}
            >
              This map is built from patterns. No raw content is ever stored.
            </p>
          </section>

          {/* Actions */}
          <section className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/vent"
              className={`px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 ${isDayMode
                ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                }`}
            >
              Vent again
            </Link>
            <Link
              href="/showing-up"
              className={`px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 ${isDayMode
                ? "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                : "border-neutral-800 text-neutral-500 hover:bg-neutral-900"
                }`}
            >
              Showing Up
            </Link>
          </section>
        </main>
      </div>
    </div>
  )
}
