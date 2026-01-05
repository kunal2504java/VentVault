"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useParticleSettings, LANDING_DEFAULTS, APP_DEFAULTS } from "@/lib/particle-context"

interface SliderProps {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (value: number) => void
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-mono text-neutral-400">{label}</label>
                <span className="text-xs font-mono text-neutral-500">{value.toFixed(2)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-primary
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-primary
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
            />
        </div>
    )
}

interface AppearanceSettingsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AppearanceSettings({ open, onOpenChange }: AppearanceSettingsProps) {
    const { settings, updateSettings, resetToDefaults, isLandingPage } = useParticleSettings()

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {/* Overlay */}
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

                {/* Content */}
                <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-neutral-950/95 border border-neutral-800/50 shadow-2xl shadow-black/50">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-neutral-800/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <Dialog.Title className="text-lg font-sentient italic text-neutral-100">
                                    Appearance
                                </Dialog.Title>
                            </div>
                            <Dialog.Close asChild>
                                <button className="p-2 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </Dialog.Close>
                        </div>
                        <Dialog.Description className="text-xs font-mono text-neutral-500 mt-2">
                            Adjust the ambient particle effects
                        </Dialog.Description>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-8">
                        {/* Atmosphere Section */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                                Atmosphere
                            </h3>
                            <div className="space-y-5">
                                <Slider
                                    label="Movement"
                                    value={settings.speed}
                                    min={0}
                                    max={2}
                                    step={0.01}
                                    onChange={(v) => updateSettings({ speed: v })}
                                />
                                <Slider
                                    label="Intensity"
                                    value={settings.noiseIntensity}
                                    min={0}
                                    max={2}
                                    step={0.01}
                                    onChange={(v) => updateSettings({ noiseIntensity: v })}
                                />
                                <Slider
                                    label="Brightness"
                                    value={settings.opacity}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onChange={(v) => updateSettings({ opacity: v })}
                                />
                            </div>
                        </section>

                        {/* Focus Section */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                                Focus
                            </h3>
                            <div className="space-y-5">
                                <Slider
                                    label="Depth"
                                    value={settings.focus}
                                    min={0.1}
                                    max={20}
                                    step={0.1}
                                    onChange={(v) => updateSettings({ focus: v })}
                                />
                                <Slider
                                    label="Softness"
                                    value={settings.aperture}
                                    min={0}
                                    max={2}
                                    step={0.01}
                                    onChange={(v) => updateSettings({ aperture: v })}
                                />
                            </div>
                        </section>

                        {/* Vignette Section */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-600">
                                Vignette
                            </h3>
                            <div className="space-y-5">
                                <Slider
                                    label="Darkness"
                                    value={settings.vignetteDarkness}
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    onChange={(v) => updateSettings({ vignetteDarkness: v })}
                                />
                                <Slider
                                    label="Spread"
                                    value={settings.vignetteOffset}
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    onChange={(v) => updateSettings({ vignetteOffset: v })}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-neutral-950/95 backdrop-blur-sm px-6 py-4 border-t border-neutral-800/30">
                        <button
                            onClick={() => resetToDefaults(isLandingPage ? "landing" : "app")}
                            className="w-full py-2.5 rounded-xl text-sm font-mono text-neutral-400 hover:text-neutral-200 bg-neutral-900/50 hover:bg-neutral-800/50 border border-neutral-800/50 transition-colors"
                        >
                            Reset to defaults
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
