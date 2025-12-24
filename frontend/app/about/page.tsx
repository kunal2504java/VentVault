"use client"

import { useState, useEffect } from "react"
import { GL } from "@/components/gl"
import Link from "next/link"

export default function AboutPage() {
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
                {/* 1. Opening Section */}
                <header className="pt-24 pb-20 px-6 text-center max-w-3xl mx-auto">
                    <h1
                        className="text-4xl md:text-5xl lg:text-6xl font-sentient italic font-light mb-8 transition-colors duration-700 whitespace-nowrap"
                        style={{ color: "#FFC700" }}
                    >
                        A place to put things down
                    </h1>
                    <p
                        className={`text-lg md:text-xl font-sentient leading-relaxed transition-colors duration-700 ${isDayMode ? "text-neutral-600" : "text-neutral-400"
                            }`}
                    >
                        Not everything needs fixing.
                        <br />
                        Some things just need space.
                    </p>
                </header>

                <main className="px-6 pb-24 max-w-2xl mx-auto">
                    {/* 2. Why This Exists */}
                    <section className="mb-20">
                        <h2
                            className={`text-sm font-mono mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-neutral-500"
                                }`}
                        >
                            Why this exists
                        </h2>
                        <div
                            className={`space-y-6 font-sentient text-lg leading-relaxed transition-colors duration-700 ${isDayMode ? "text-neutral-700" : "text-neutral-300"
                                }`}
                        >
                            <p>
                                A lot of us walk around holding things in. Not because we want
                                to — but because we don't know where else they can go.
                            </p>
                            <p>
                                Talking to friends can feel heavy. Social media doesn't feel
                                safe. And silence makes things worse.
                            </p>
                            <p
                                className={`${isDayMode ? "text-neutral-500" : "text-neutral-400"
                                    }`}
                            >
                                VentVault isn't therapy. It's not advice. It's not judgment.
                                <br />
                                It's just space.
                            </p>
                        </div>
                    </section>

                    {/* 3. What Makes This Different */}
                    <section className="mb-20">
                        <h2
                            className={`text-sm font-mono mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-neutral-500"
                                }`}
                        >
                            This isn't a chatbot conversation
                        </h2>
                        <div
                            className={`space-y-6 font-sentient text-lg leading-relaxed transition-colors duration-700 ${isDayMode ? "text-neutral-700" : "text-neutral-300"
                                }`}
                        >
                            <p>
                                AI assistants are great for answers, tasks, and thinking through
                                problems. But that's not what this is.
                            </p>
                            <p>
                                You don't come here to ask something.
                                <br />
                                You come here to let something out.
                            </p>
                            <p
                                className={`${isDayMode ? "text-neutral-500" : "text-neutral-400"
                                    }`}
                            >
                                You don't need to phrase things correctly. You don't need to ask
                                a good question. You don't need to know what you want.
                            </p>
                        </div>
                    </section>

                    {/* 4. Core Values */}
                    <section className="mb-20">
                        <h2
                            className={`text-sm font-mono mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-neutral-500"
                                }`}
                        >
                            What you'll find here
                        </h2>
                        <div
                            className={`space-y-4 font-sentient text-lg leading-relaxed transition-colors duration-700 ${isDayMode ? "text-neutral-700" : "text-neutral-300"
                                }`}
                        >
                            <p>You won't be corrected.</p>
                            <p>You won't be rushed.</p>
                            <p>You won't be told how you should feel.</p>
                            <p>You won't be compared to anyone else.</p>
                            <p>You won't be watched.</p>
                            <p
                                className={`mt-8 text-base ${isDayMode ? "text-neutral-500" : "text-neutral-500"
                                    }`}
                            >
                                Your words are processed to respond — not stored to analyze.
                            </p>
                        </div>
                    </section>

                    {/* 5. Developer's Note */}
                    <section
                        className={`mb-20 p-8 rounded-2xl transition-all duration-500 ${isDayMode
                            ? "bg-white/40 border border-neutral-200"
                            : "bg-neutral-900/30 border border-neutral-800"
                            }`}
                    >
                        <h2
                            className={`text-sm font-mono mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-amber-200/60"
                                }`}
                        >
                            A note from the person who built this
                        </h2>
                        <div
                            className={`space-y-6 font-sentient text-lg leading-relaxed transition-colors duration-700 ${isDayMode ? "text-neutral-700" : "text-neutral-300"
                                }`}
                        >
                            <p>
                                I've always found it hard to talk about things that hurt me. Not
                                because I didn't feel them — but because I didn't know how to
                                say them out loud.
                            </p>
                            <p>
                                I didn't want advice. I didn't want to burden anyone. I just
                                wanted to be heard without having to perform or explain.
                            </p>
                            <p
                                className={`${isDayMode ? "text-neutral-500" : "text-neutral-400"
                                    }`}
                            >
                                This app wasn't built to fix people. It was built to sit with
                                them.
                            </p>
                            <p
                                className={`font-sentient italic ${isDayMode ? "text-neutral-600" : "text-neutral-300"
                                    }`}
                            >
                                VentVault is the space I needed before I knew how to ask for it.
                            </p>
                        </div>
                    </section>

                    {/* 6. Who This Is For */}
                    <section className="mb-20">
                        <h2
                            className={`text-sm font-mono mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-500" : "text-neutral-500"
                                }`}
                        >
                            If this feels familiar
                        </h2>
                        <div
                            className={`space-y-6 font-sentient text-lg leading-relaxed transition-colors duration-700 ${isDayMode ? "text-neutral-700" : "text-neutral-300"
                                }`}
                        >
                            <p>
                                Maybe you overthink things. Maybe you hold things in because you
                                don't want to bother anyone. Maybe you just want to exhale
                                without having to explain.
                            </p>
                            <p
                                className={`${isDayMode ? "text-neutral-500" : "text-neutral-400"
                                    }`}
                            >
                                You don't have to be in crisis to need a place to put things
                                down.
                            </p>
                        </div>
                    </section>

                    {/* 7. Closing Section */}
                    <section className="text-center pt-8">
                        <h2
                            className={`text-2xl md:text-3xl font-sentient italic font-light mb-6 transition-colors duration-700 ${isDayMode ? "text-neutral-800" : "text-white"
                                }`}
                        >
                            You're welcome here
                        </h2>
                        <p
                            className={`font-sentient text-lg leading-relaxed mb-10 transition-colors duration-700 ${isDayMode ? "text-neutral-600" : "text-neutral-400"
                                }`}
                        >
                            You don't need to explain yourself.
                            <br />
                            You don't need to commit to anything.
                            <br />
                            You can come, speak, and leave — or stay.
                        </p>
                        <Link
                            href="/vent"
                            className={`inline-block px-10 py-4 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 ${isDayMode
                                ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                                : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                                }`}
                        >
                            Vent when you're ready
                        </Link>
                    </section>
                </main>
            </div>
        </div>
    )
}
