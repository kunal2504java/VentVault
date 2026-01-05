"use client"

import { useState, useEffect } from "react"
import { GL } from "@/components/gl"
import Link from "next/link"
import { getPresenceData, type PresenceData } from "@/lib/api-client"
import { useParticleSettings, APP_DEFAULTS } from "@/lib/particle-context"

// Default insights used as fallback
const gentleInsights = [
    "You tend to check in more during quieter hours.",
    "Some days needed more space than others.",
    "You came back even after long gaps — that counts.",
    "There's no pattern you need to fix.",
    "The rhythm is yours.",
]

// Quiet reminders that feel like whispers
const quietReminders = [
    "You don't need to earn rest.",
    "There's nothing to catch up on.",
    "You're allowed to come and go.",
    "This isn't a race.",
    "Showing up once is still showing up.",
]

// Header subtexts
const headerSubtexts = [
    "Every time you came back mattered.",
    "This isn't about streaks. It's about presence.",
    "There's no perfect way to show up.",
]

export default function ShowingUpPage() {
    const { updateSettings } = useParticleSettings()
    const [currentInsight, setCurrentInsight] = useState(0)
    const [currentReminder, setCurrentReminder] = useState(0)
    const [headerSubtext] = useState(() =>
        headerSubtexts[Math.floor(Math.random() * headerSubtexts.length)]
    )

    // Real data from backend
    const [presenceData, setPresenceData] = useState<PresenceData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Computed values with fallbacks
    const daysShowedUp = presenceData?.days_showed_up ?? 0
    const checkInDots = presenceData?.check_in_pattern ?? Array.from({ length: 30 }, () => false)

    // Build insights from real data + defaults
    const allInsights = [
        presenceData?.insights?.time_based,
        presenceData?.insights?.gap_based,
        ...gentleInsights
    ].filter(Boolean) as string[]

    // Fetch presence data
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            const data = await getPresenceData()
            setPresenceData(data)
            setIsLoading(false)
        }
        fetchData()
    }, [])

    // Apply reduced particle settings for this page
    useEffect(() => {
        updateSettings(APP_DEFAULTS)
    }, [updateSettings])

    // Rotate insights slowly
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentInsight((prev) => (prev + 1) % allInsights.length)
        }, 8000)
        return () => clearInterval(interval)
    }, [allInsights.length])

    // Rotate reminders slowly
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentReminder((prev) => (prev + 1) % quietReminders.length)
        }, 12000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div
            className="min-h-screen transition-all duration-700 bg-gradient-to-br from-black via-neutral-900/80 to-amber-950/20"
        >
            <GL hovering={false} />

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Main Content */}
                <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-2xl mx-auto">

                    {/* 1. Page Header */}
                    <header className="text-center mb-16">
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl font-sentient italic font-light mb-4 transition-colors duration-700"
                            style={{ color: "#FFC700" }}
                        >
                            Showing Up
                        </h1>
                        <p className="text-sm md:text-base font-mono transition-colors duration-700 text-neutral-400">
                            {headerSubtext}
                        </p>
                    </header>

                    {/* 2. Primary Presence Summary */}
                    <section className="text-center mb-20">
                        <p className="text-3xl md:text-4xl lg:text-5xl font-sentient mb-6 transition-colors duration-700 text-stone-200">
                            You showed up on{" "}
                            <span className="text-white">
                                {daysShowedUp}
                            </span>{" "}
                            days
                        </p>
                        <p className="text-base md:text-lg font-sentient transition-colors duration-700 text-neutral-400">
                            That's {daysShowedUp} moments you chose to let something out.
                        </p>
                    </section>

                    {/* 3. Gentle Timeline */}
                    <section className="w-full mb-20">
                        <h2 className="text-xs font-mono uppercase tracking-widest mb-4 transition-colors duration-700 text-neutral-400">
                            Moments You Checked In
                        </h2>
                        <p className="text-xs font-mono mb-6 transition-colors duration-700 text-neutral-400">
                            These are days you took a pause — nothing more, nothing less.
                        </p>

                        {/* Soft dot visualization */}
                        <div className="flex flex-wrap gap-2 justify-start">
                            {checkInDots.map((active, index) => (
                                <div
                                    key={index}
                                    className={`w-3 h-3 rounded-full transition-all duration-500 ${active
                                        ? "bg-neutral-500"
                                        : "bg-neutral-800"
                                        }`}
                                />
                            ))}
                        </div>
                    </section>

                    {/* 4. Soft Reflection Section */}
                    <section className="w-full p-6 rounded-2xl mb-16 transition-all duration-700 bg-neutral-900/40 border border-neutral-800">
                        <h3 className="text-xs font-mono uppercase tracking-widest mb-4 transition-colors duration-700 text-amber-200/70">
                            What We Noticed
                        </h3>
                        <p className="text-lg md:text-xl font-sentient transition-all duration-1000 text-white">
                            {allInsights[currentInsight] || gentleInsights[0]}
                        </p>
                    </section>

                    {/* 5. Streak Reframe */}
                    <section className="w-full mb-16 text-center">
                        <h3 className="text-xs font-mono uppercase tracking-widest mb-3 transition-colors duration-700 text-neutral-400">
                            Not a Streak
                        </h3>
                        <p className="text-xs md:text-sm font-mono leading-relaxed max-w-md mx-auto transition-colors duration-700 text-neutral-400">
                            We don't track streaks here because life isn't linear.
                            <br />
                            Showing up once matters as much as showing up often.
                        </p>
                    </section>

                    {/* 6. Quiet Affirmation */}
                    <section className="w-full mb-20 text-center">
                        <h4 className="text-xs font-mono uppercase tracking-widest mb-4 transition-colors duration-700 text-neutral-400">
                            A Quiet Reminder
                        </h4>
                        <p className="text-base font-sentient italic transition-all duration-1000 text-amber-100/80">
                            {quietReminders[currentReminder]}
                        </p>
                    </section>

                    {/* 7. Gentle Actions */}
                    <section className="w-full flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <div className="text-center">
                            <Link
                                href="/vent"
                                className="inline-block px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                            >
                                Vent again
                            </Link>
                            <p className="text-xs font-mono mt-2 transition-colors duration-700 text-neutral-600">
                                Only if you feel like it.
                            </p>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/mood-map"
                                className="inline-block px-8 py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 border-neutral-800 text-neutral-500 hover:bg-neutral-900"
                            >
                                View Mood Map
                            </Link>
                            <p className="text-xs font-mono mt-2 transition-colors duration-700 text-neutral-600">
                                Patterns, not memories.
                            </p>
                        </div>
                    </section>
                </main>

                {/* 8. Privacy Reassurance Footer */}
                <footer className="pb-8">
                    <p className="text-center text-xs font-mono transition-colors duration-700 text-neutral-700">
                        This page is built from patterns, not stored content.
                    </p>
                </footer>
            </div>
        </div>
    )
}

