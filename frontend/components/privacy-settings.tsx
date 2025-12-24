"use client"

import { useState, useEffect } from "react"
import {
  getConsents,
  updateConsents,
  exportUserData,
  deleteUserData,
  getLocalConsent,
  setLocalConsent,
  type ConsentStatus,
} from "@/lib/consent-api"

interface PrivacySettingsProps {
  isOpen: boolean
  onClose: () => void
  isDayMode?: boolean
}

// Custom Toggle Switch Component
function Toggle({ 
  checked, 
  onChange, 
  isDayMode 
}: { 
  checked: boolean
  onChange: (checked: boolean) => void
  isDayMode: boolean 
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC700]/50 ${
        checked 
          ? "bg-[#FFC700]" 
          : isDayMode 
            ? "bg-neutral-300" 
            : "bg-neutral-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        } ${
          isDayMode ? "bg-white" : "bg-neutral-200"
        }`}
      />
    </button>
  )
}

export function PrivacySettings({ isOpen, onClose, isDayMode = false }: PrivacySettingsProps) {
  const [consents, setConsents] = useState<Partial<ConsentStatus>>({
    analytics: false,
    location: false,
    save_history: false,
    marketing: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadConsents()
    }
  }, [isOpen])

  const loadConsents = async () => {
    setIsLoading(true)
    try {
      const response = await getConsents()
      setConsents(response.consents)
    } catch (error) {
      // Fall back to local storage
      const local = getLocalConsent()
      if (local) {
        setConsents(local)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      await updateConsents(consents)
      setLocalConsent(consents)
      setMessage({ type: "success", text: "Preferences saved" })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      setLocalConsent(consents)
      setMessage({ type: "error", text: "Saved locally" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportUserData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ventvault-data-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: "success", text: "Data exported" })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Export failed" })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUserData()
      localStorage.clear()
      setMessage({ type: "success", text: "All data deleted" })
      setShowDeleteConfirm(false)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({ type: "error", text: "Delete failed" })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-3xl overflow-hidden transition-all duration-300 ${
          isDayMode 
            ? "bg-white/95 shadow-2xl" 
            : "bg-neutral-900/95 border border-neutral-800/50 shadow-2xl shadow-black/50"
        }`}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl font-sentient ${
                isDayMode ? "text-neutral-800" : "text-white"
              }`}
            >
              Privacy
            </h2>
            <button
              onClick={onClose}
              className={`p-2 -mr-2 rounded-full transition-all duration-200 ${
                isDayMode
                  ? "hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                  : "hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#FFC700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Consent toggles */}
              <div className="space-y-4">
                {/* Analytics Toggle */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    isDayMode ? "bg-neutral-50" : "bg-neutral-800/40"
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <span
                      className={`text-sm font-medium font-sentient ${
                        isDayMode ? "text-neutral-800" : "text-white"
                      }`}
                    >
                      Anonymous Analytics
                    </span>
                    <p
                      className={`text-xs mt-1 font-mono ${
                        isDayMode ? "text-neutral-500" : "text-neutral-500"
                      }`}
                    >
                      Help improve VentVault
                    </p>
                  </div>
                  <Toggle
                    checked={consents.analytics || false}
                    onChange={(checked) => setConsents({ ...consents, analytics: checked })}
                    isDayMode={isDayMode}
                  />
                </div>

                {/* Location Toggle */}
                <div 
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    isDayMode ? "bg-neutral-50" : "bg-neutral-800/40"
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <span
                      className={`text-sm font-medium font-sentient ${
                        isDayMode ? "text-neutral-800" : "text-white"
                      }`}
                    >
                      Location
                    </span>
                    <p
                      className={`text-xs mt-1 font-mono ${
                        isDayMode ? "text-neutral-500" : "text-neutral-500"
                      }`}
                    >
                      Local crisis resources
                    </p>
                  </div>
                  <Toggle
                    checked={consents.location || false}
                    onChange={(checked) => setConsents({ ...consents, location: checked })}
                    isDayMode={isDayMode}
                  />
                </div>
              </div>

              {/* Privacy note */}
              <p
                className={`text-xs font-mono text-center px-4 ${
                  isDayMode ? "text-neutral-400" : "text-neutral-600"
                }`}
              >
                Your vents are never stored. Only anonymous patterns are collected.
              </p>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-3 font-mono text-sm tracking-wider rounded-full border transition-all duration-300 ${
                  isDayMode
                    ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                    : "border-neutral-700 text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                }`}
              >
                {isSaving ? "Saving..." : "Save preferences"}
              </button>

              {/* Message */}
              {message && (
                <p
                  className={`text-xs font-mono text-center transition-opacity duration-300 ${
                    message.type === "success" 
                      ? isDayMode ? "text-green-600" : "text-green-400"
                      : isDayMode ? "text-red-600" : "text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}

              {/* Data management section */}
              <div
                className={`pt-4 border-t ${
                  isDayMode ? "border-neutral-200" : "border-neutral-800"
                }`}
              >
                <p
                  className={`text-xs font-mono mb-4 ${
                    isDayMode ? "text-neutral-500" : "text-neutral-500"
                  }`}
                >
                  Your data
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className={`flex-1 py-2.5 text-xs font-mono tracking-wider rounded-full border transition-all duration-300 ${
                      isDayMode
                        ? "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                        : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                    }`}
                  >
                    Export
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`flex-1 py-2.5 text-xs font-mono tracking-wider rounded-full border transition-all duration-300 ${
                      isDayMode
                        ? "border-red-200 text-red-500 hover:bg-red-50"
                        : "border-red-900/50 text-red-400 hover:bg-red-900/20"
                    }`}
                  >
                    Delete all
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm && (
                <div
                  className={`p-4 rounded-2xl ${
                    isDayMode ? "bg-red-50" : "bg-red-900/20"
                  }`}
                >
                  <p
                    className={`text-xs font-mono mb-4 ${
                      isDayMode ? "text-red-700" : "text-red-300"
                    }`}
                  >
                    This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2.5 text-xs font-mono tracking-wider rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      Delete everything
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={`flex-1 py-2.5 text-xs font-mono tracking-wider rounded-full transition-colors ${
                        isDayMode
                          ? "bg-neutral-200 hover:bg-neutral-300 text-neutral-700"
                          : "bg-neutral-700 hover:bg-neutral-600 text-white"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
