"use client"

import { useEffect } from "react"
import { GL } from "@/components/gl"
import Link from "next/link"
import { useParticleSettings, APP_DEFAULTS } from "@/lib/particle-context"

export default function ListeningSpacePage() {
    const { updateSettings } = useParticleSettings()

    // Apply reduced particle settings for this page
    useEffect(() => {
        updateSettings(APP_DEFAULTS)
    }, [updateSettings])

    return (
        <div className="h-screen w-screen overflow-hidden relative transition-all duration-700 bg-gradient-to-br from-black via-neutral-900/80 to-amber-950/20">
            {/* Ambient background - same as vent screen */}
            <GL hovering={false} />

            {/* Frosted glass overlay - signals the space is being prepared */}
            <div className="absolute inset-0 backdrop-blur-md transition-all duration-700 bg-neutral-950/40" />

            {/* Content layer */}
            <div className="relative z-10 h-full flex flex-col items-center justify-between py-12 px-6">
                {/* Top spacer for balance */}
                <div />

                {/* Main content - centered */}
                <div className="flex flex-col items-center">
                    {/* Header label - small, quiet */}
                    <p className="text-xs font-mono tracking-widest uppercase mb-8 transition-colors duration-700 text-neutral-600">
                        Listening Space
                    </p>

                    {/* Main heading */}
                    <h1
                        className="text-center mb-6"
                        style={{ color: "#FFC700" }}
                    >
                        <span className="block text-3xl md:text-4xl lg:text-5xl font-sentient italic font-light">
                            A space to talk.
                        </span>
                        <span className="block text-3xl md:text-4xl lg:text-5xl font-sentient italic font-light mt-1">
                            And be heard.
                        </span>
                    </h1>

                    {/* Supporting copy */}
                    <p className="text-center max-w-lg font-sentient text-base md:text-lg leading-relaxed mb-10 transition-colors duration-700 text-neutral-400">
                        Listening Space is where VentVault becomes a two-way conversation.
                        <br />
                        Not typing. Not venting into silence.
                        <br />
                        Just talking — and being met with presence.
                    </p>

                    {/* What's being built */}
                    <div className="text-center max-w-md mb-10">
                        <h2 className="text-xs font-mono tracking-wider uppercase mb-5 transition-colors duration-700 text-neutral-500">
                            What's being built here
                        </h2>
                        <div className="space-y-2 font-sentient text-sm md:text-base leading-relaxed transition-colors duration-700 text-neutral-400">
                            <p>A voice-first space, when typing feels like too much.</p>
                            <p>Two-way conversations — slow, calm, and uninterrupted.</p>
                            <p>No scripts. No pressure to say things the "right" way.</p>
                            <p>You speak. It listens. And responds with care.</p>
                            <p className="text-neutral-500">
                                Nothing is recorded or stored unless you choose.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom section - properly spaced */}
                <div className="flex flex-col items-center gap-4">
                    {/* Status indicator */}
                    <p className="text-sm font-mono transition-colors duration-700 text-neutral-600">
                        This space is being built with care.
                    </p>

                    {/* Back link */}
                    <Link
                        href="/"
                        className="font-mono text-xs tracking-wider transition-all duration-300 text-neutral-600 hover:text-neutral-400"
                    >
                        ← Return
                    </Link>

                    {/* Privacy reassurance */}
                    <p className="text-center text-xs font-mono max-w-md transition-colors duration-700 text-neutral-700">
                        Listening Space will follow the same privacy promises as everything else here.
                    </p>
                </div>
            </div>
        </div>
    )
}
