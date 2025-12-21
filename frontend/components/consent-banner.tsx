"use client"

import { useState, useEffect } from "react"
import {
  hasConsentBeenShown,
  markConsentShown,
  updateConsents,
  setLocalConsent,
  type ConsentStatus,
} from "@/lib/consent-api"

interface ConsentBannerProps {
  onConsentGiven?: (consents: Partial<ConsentStatus>) => void
}

export function ConsentBanner({ onConsentGiven }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consents, setConsents] = useState<Partial<ConsentStatus>>({
    analytics: true, // Default to true for anonymous analytics
    location: false,
    save_history: false,
    marketing: false,
  })

  useEffect(() => {
    // Only show if not already shown
    if (!hasConsentBeenShown()) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = async () => {
    const allConsents: Partial<ConsentStatus> = {
      analytics: true,
      location: true,
      save_history: false,
      marketing: false,
    }

    try {
      await updateConsents(allConsents)
      setLocalConsent(allConsents)
    } catch (error) {
      // Still save locally if API fails
      setLocalConsent(allConsents)
    }

    markConsentShown()
    setIsVisible(false)
    onConsentGiven?.(allConsents)
  }

  const handleAcceptSelected = async () => {
    try {
      await updateConsents(consents)
      setLocalConsent(consents)
    } catch (error) {
      setLocalConsent(consents)
    }

    markConsentShown()
    setIsVisible(false)
    onConsentGiven?.(consents)
  }

  const handleRejectAll = async () => {
    const noConsents: Partial<ConsentStatus> = {
      analytics: false,
      location: false,
      save_history: false,
      marketing: false,
    }

    try {
      await updateConsents(noConsents)
      setLocalConsent(noConsents)
    } catch (error) {
      setLocalConsent(noConsents)
    }

    markConsentShown()
    setIsVisible(false)
    onConsentGiven?.(noConsents)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Main content */}
        <div className="p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Your Privacy Matters
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4">
            VentVault uses anonymous analytics to improve your experience. We never store the content of your vents.
            {" "}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[#FFC700] hover:underline"
            >
              {showDetails ? "Hide details" : "Learn more"}
            </button>
          </p>

          {/* Detailed options */}
          {showDetails && (
            <div className="space-y-3 mb-4 p-4 bg-neutral-800/50 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.analytics}
                  onChange={(e) =>
                    setConsents({ ...consents, analytics: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-[#FFC700] focus:ring-[#FFC700] focus:ring-offset-0"
                />
                <div>
                  <span className="text-white text-sm font-medium">Anonymous Analytics</span>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    Help us understand usage patterns. No personal data collected.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.location}
                  onChange={(e) =>
                    setConsents({ ...consents, location: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-[#FFC700] focus:ring-[#FFC700] focus:ring-offset-0"
                />
                <div>
                  <span className="text-white text-sm font-medium">Location (City-level)</span>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    Enables local crisis resources. Only stores city, never precise location.
                  </p>
                </div>
              </label>

              <div className="pt-2 border-t border-neutral-700">
                <p className="text-neutral-500 text-xs">
                  📝 Your vent content is NEVER stored. You can change these settings or delete your data anytime.
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showDetails ? (
              <>
                <button
                  onClick={handleAcceptSelected}
                  className="flex-1 px-4 py-2.5 bg-[#FFC700] hover:bg-[#e6b300] text-black font-medium rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleRejectAll}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
                >
                  Reject All
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2.5 bg-[#FFC700] hover:bg-[#e6b300] text-black font-medium rounded-lg transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
                >
                  Customize
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
