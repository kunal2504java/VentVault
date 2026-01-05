"use client"

import { useEffect, useState } from "react"
import { GL } from "@/components/gl"
import Link from "next/link"
import { useParticleSettings, APP_DEFAULTS } from "@/lib/particle-context"
import { getMoodMapData, MoodMapData, EmotionData } from "@/lib/api-client"

// Emotion colors - calm and muted but distinct
const emotionColors: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  // Emotional Load
  anxiety: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-300", accent: "#fbbf24" },
  stress: { bg: "bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-300", accent: "#fb923c" },
  sadness: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-300", accent: "#60a5fa" },
  confusion: { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-300", accent: "#22d3ee" },
  fear: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-300", accent: "#c084fc" },
  hopelessness: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-300", accent: "#94a3b8" },
  // Processing
  overwhelm: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-300", accent: "#94a3b8" },
  frustration: { bg: "bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-300", accent: "#fb7185" },
  anger: { bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-300", accent: "#f87171" },
  loneliness: { bg: "bg-violet-500/20", border: "border-violet-500/30", text: "text-violet-300", accent: "#a78bfa" },
  grief: { bg: "bg-slate-500/20", border: "border-slate-500/30", text: "text-slate-300", accent: "#94a3b8" },
  restlessness: { bg: "bg-amber-600/20", border: "border-amber-600/30", text: "text-amber-200", accent: "#d97706" },
  // Release
  relief: { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-300", accent: "#34d399" },
  calm: { bg: "bg-teal-500/20", border: "border-teal-500/30", text: "text-teal-300", accent: "#2dd4bf" },
  grounded: { bg: "bg-green-600/20", border: "border-green-600/30", text: "text-green-300", accent: "#22c55e" },
  // Positive Shifts
  clarity: { bg: "bg-sky-400/20", border: "border-sky-400/30", text: "text-sky-300", accent: "#38bdf8" },
  hope: { bg: "bg-yellow-400/20", border: "border-yellow-400/30", text: "text-yellow-200", accent: "#facc15" },
  contentment: { bg: "bg-lime-500/20", border: "border-lime-500/30", text: "text-lime-300", accent: "#84cc16" },
  // Conditional
  joy: { bg: "bg-amber-300/10", border: "border-amber-300/20", text: "text-amber-200/80", accent: "#fcd34d" },
  gratitude: { bg: "bg-rose-300/10", border: "border-rose-300/20", text: "text-rose-200/80", accent: "#fda4af" },
  // Fallback
  other: { bg: "bg-neutral-500/20", border: "border-neutral-500/30", text: "text-neutral-300", accent: "#737373" },
}

// Emotion bar component - reused for consistency
const EmotionBar = ({ emotion, percentage, isConditional = false }: { emotion: string; percentage: number; isConditional?: boolean }) => {
  const colors = emotionColors[emotion] || emotionColors.other
  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all ${isConditional ? "duration-700" : "duration-300"} hover:scale-[1.01] ${colors.bg} ${colors.border} hover:border-opacity-50`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
          <span className={`font-mono text-sm capitalize ${colors.text}`}>
            {emotion}
          </span>
        </div>
        <span className="font-mono text-xs text-neutral-400">
          {percentage}%
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full overflow-hidden bg-neutral-800">
        <div
          className={`h-full rounded-full ${isConditional ? "transition-all duration-1000" : "transition-all duration-500"}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.accent,
          }}
        />
      </div>
    </div>
  )
}

// Section header component
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4 mt-8 first:mt-0">
    {children}
  </p>
)

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-16 bg-neutral-800/50 rounded-2xl" />
    <div className="h-16 bg-neutral-800/50 rounded-2xl" />
    <div className="h-16 bg-neutral-800/50 rounded-2xl" />
  </div>
)

// Empty state message
const EmptyState = ({ insight }: { insight: { type: string; description: string } }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neutral-800/50 flex items-center justify-center">
      <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </div>
    <h3 className="text-2xl font-sentient text-white mb-4">{insight.type}</h3>
    <p className="text-neutral-400 font-mono text-sm max-w-md mx-auto leading-relaxed">
      {insight.description}
    </p>
    <Link
      href="/vent"
      className="inline-block mt-8 px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 border-amber-700/50 text-amber-200 hover:bg-amber-900/20"
    >
      Start venting
    </Link>
  </div>
)

export default function MoodMapPage() {
  const { updateSettings } = useParticleSettings()
  const [moodData, setMoodData] = useState<MoodMapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Apply reduced particle settings for this page
  useEffect(() => {
    updateSettings(APP_DEFAULTS)
  }, [updateSettings])

  // Fetch mood map data from backend
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const data = await getMoodMapData()
      setMoodData(data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // Conditional rendering logic for Joy and Gratitude
  const reliefPercentage = moodData?.release.find(e => e.emotion === "relief")?.percentage || 0
  const hasCalm = moodData?.release.some(e => e.emotion === "calm") || false
  const hasClarity = moodData?.positive_shifts.some(e => e.emotion === "clarity") || false
  const showConditionalEmotions = reliefPercentage > 15 && (hasCalm || hasClarity) && (moodData?.conditional.length || 0) > 0

  return (
    <div className="min-h-screen transition-all duration-700 bg-gradient-to-br from-black via-neutral-900/80 to-amber-950/20">
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
          <p className="text-sm md:text-base font-mono transition-colors duration-700 text-neutral-400">
            Patterns, not memories. This is built from signals, not stored content.
          </p>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-16 max-w-5xl mx-auto">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !moodData?.has_data ? (
            <EmptyState insight={moodData?.insight || { type: "New Here", description: "Start venting to see your emotional patterns." }} />
          ) : (
            <>
              {/* Emotion Distribution Section */}
              <section className="mb-16">
                <h2 className="text-sm font-mono mb-2 transition-colors duration-700 text-neutral-400">
                  Your Emotional State (Evolving)
                </h2>
                <p className="text-xs font-mono mb-6 text-neutral-600">
                  These signals update as you speak.
                </p>

                <div className="grid gap-3">
                  {/* Emotional Load Detected */}
                  {moodData.emotional_load.length > 0 && (
                    <>
                      <SectionLabel>Emotional Load Detected</SectionLabel>
                      {moodData.emotional_load.map((item) => (
                        <EmotionBar key={item.emotion} emotion={item.emotion} percentage={item.percentage} />
                      ))}
                    </>
                  )}

                  {/* Processing in Progress */}
                  {moodData.processing.length > 0 && (
                    <>
                      <SectionLabel>Processing in Progress</SectionLabel>
                      {moodData.processing.map((item) => (
                        <EmotionBar key={item.emotion} emotion={item.emotion} percentage={item.percentage} />
                      ))}
                    </>
                  )}

                  {/* Signs of Emotional Release */}
                  {moodData.release.length > 0 && (
                    <>
                      <SectionLabel>Signs of Emotional Release</SectionLabel>
                      {moodData.release.map((item) => (
                        <EmotionBar key={item.emotion} emotion={item.emotion} percentage={item.percentage} />
                      ))}
                    </>
                  )}

                  {/* Positive Shifts Emerging */}
                  {moodData.positive_shifts.length > 0 && (
                    <>
                      <SectionLabel>Positive Shifts Emerging</SectionLabel>
                      {moodData.positive_shifts.map((item) => (
                        <EmotionBar key={item.emotion} emotion={item.emotion} percentage={item.percentage} />
                      ))}
                    </>
                  )}

                  {/* Conditional: Joy and Gratitude */}
                  {showConditionalEmotions && (
                    <>
                      {moodData.conditional.map((item) => (
                        <EmotionBar
                          key={item.emotion}
                          emotion={item.emotion}
                          percentage={item.percentage}
                          isConditional={true}
                        />
                      ))}
                    </>
                  )}
                </div>
              </section>

              {/* Two Column Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-16">
                {/* When You Tend to Vent */}
                {moodData.time_data && (
                  <section className="p-6 rounded-2xl border transition-all duration-300 bg-neutral-900/40 border-neutral-800">
                    <h3 className="text-xs font-mono mb-4 transition-colors duration-700 text-amber-200/70">
                      When You Tend to Vent
                    </h3>
                    <div className="text-2xl md:text-3xl font-sentient mb-2 transition-colors duration-700 text-white">
                      {moodData.time_data.most_active_day}, {moodData.time_data.most_active_time}
                    </div>
                    <p className="text-sm font-mono transition-colors duration-700 text-neutral-400">
                      You are a {moodData.time_data.time_of_day_label.toLowerCase()}.
                    </p>
                  </section>
                )}

                {/* Your Emotional Style */}
                <section className="p-6 rounded-2xl border transition-all duration-300 bg-neutral-900/40 border-neutral-800">
                  <h3 className="text-xs font-mono mb-4 transition-colors duration-700 text-amber-200/70">
                    Your Emotional Style
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white">
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
                      <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                        You are a
                      </p>
                      <h4 className="text-2xl md:text-3xl font-sentient text-white">
                        {moodData.insight.type}
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm font-mono leading-relaxed text-neutral-400">
                    {moodData.insight.description}
                  </p>
                </section>
              </div>

              {/* Most Felt Emotion */}
              {moodData.most_felt_emotion && (
                <section className="p-8 rounded-3xl mb-16 text-center transition-all duration-300 bg-gradient-to-br from-amber-900/20 via-rose-900/20 to-violet-900/20 border border-amber-700/20">
                  <p className="text-xs font-mono uppercase tracking-wider mb-2 text-neutral-400">
                    Most Felt Emotion
                  </p>
                  <h3 className="text-4xl md:text-5xl font-sentient italic mb-4 capitalize text-white">
                    {moodData.most_felt_emotion.emotion}
                  </h3>
                  <p className="text-sm font-mono text-neutral-400">
                    Appeared in {moodData.most_felt_emotion.percentage}% of your check-ins.
                  </p>
                </section>
              )}

              {/* Privacy Reminder */}
              <section className="text-center mb-12">
                <p className="text-xs font-mono text-neutral-600">
                  This map is built from patterns. No raw content is ever stored.
                </p>
              </section>

              {/* Actions */}
              <section className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/vent"
                  className="px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Vent again
                </Link>
                <Link
                  href="/showing-up"
                  className="px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 border-neutral-800 text-neutral-500 hover:bg-neutral-900"
                >
                  Showing Up
                </Link>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
