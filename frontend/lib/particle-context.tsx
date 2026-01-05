"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// Existing defaults (Landing page + Vent page)
export const LANDING_DEFAULTS = {
    speed: 1.0,
    noiseScale: 0.6,
    noiseIntensity: 0.52,
    timeScale: 1,
    focus: 3.8,
    aperture: 1.79,
    pointSize: 10.0,
    opacity: 0.8,
    planeScale: 10.0,
    size: 512,
    vignetteDarkness: 1.5,
    vignetteOffset: 0.4,
    useManualTime: false,
    manualTime: 0,
}

// Custom defaults (Rest of the app - from user's screenshot)
export const APP_DEFAULTS = {
    speed: 0.59,
    noiseScale: 0.6,
    noiseIntensity: 0.52,
    timeScale: 1.0,
    focus: 3.8,
    aperture: 1.13,
    pointSize: 10.0,
    opacity: 0.40,
    planeScale: 10.0,
    size: 512,
    vignetteDarkness: 1.5,
    vignetteOffset: 0.4,
    useManualTime: false,
    manualTime: 0,
}

export interface ParticleSettings {
    speed: number
    noiseScale: number
    noiseIntensity: number
    timeScale: number
    focus: number
    aperture: number
    pointSize: number
    opacity: number
    planeScale: number
    size: number
    vignetteDarkness: number
    vignetteOffset: number
    useManualTime: boolean
    manualTime: number
}

interface ParticleContextType {
    settings: ParticleSettings
    updateSettings: (partial: Partial<ParticleSettings>) => void
    resetToDefaults: (type: "landing" | "app") => void
    isLandingPage: boolean
    setIsLandingPage: (value: boolean) => void
}

const ParticleContext = createContext<ParticleContextType | null>(null)

export function ParticleProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ParticleSettings>(LANDING_DEFAULTS)
    const [isLandingPage, setIsLandingPageState] = useState(true)

    const updateSettings = useCallback((partial: Partial<ParticleSettings>) => {
        setSettings((prev) => ({ ...prev, ...partial }))
    }, [])

    const resetToDefaults = useCallback((type: "landing" | "app") => {
        setSettings(type === "landing" ? LANDING_DEFAULTS : APP_DEFAULTS)
    }, [])

    const setIsLandingPage = useCallback((value: boolean) => {
        setIsLandingPageState(value)
    }, [])

    return (
        <ParticleContext.Provider
            value={{
                settings,
                updateSettings,
                resetToDefaults,
                isLandingPage,
                setIsLandingPage,
            }}
        >
            {children}
        </ParticleContext.Provider>
    )
}

export function useParticleSettings() {
    const context = useContext(ParticleContext)
    if (!context) {
        // Return defaults if outside provider (for static pages)
        return {
            settings: APP_DEFAULTS,
            updateSettings: () => { },
            resetToDefaults: () => { },
            isLandingPage: false,
            setIsLandingPage: () => { },
        }
    }
    return context
}
