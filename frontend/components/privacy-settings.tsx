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
      setMessage({ type: "success", text: "Settings saved successfully" })
    } catch (error) {
      setLocalConsent(consents)
      setMessage({ type: "error", text: "Saved locally. Will sync when online." })
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
      setMessage({ type: "success", text: "Data exported successfully" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to export data" })
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
      setMessage({ type: "error", text: "Failed to delete data" })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
          isDayMode ? "bg-white" : "bg-neutral-900"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${
            isDayMode ? "border-neutral-200" : "border-neutral-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-xl font-semibold ${
                isDayMode ? "text-neutral-900" : "text-white"
              }`}
            >
              Privacy Settings
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDayMode
                  ? "hover:bg-neutral-100 text-neutral-500"
                  : "hover:bg-neutral-800 text-neutral-400"
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
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#FFC700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Consent toggles */}
              <div className="space-y-4">
                <h3
                  className={`text-sm font-medium ${
                    isDayMode ? "text-neutral-700" : "text-neutral-300"
                  }`}
                >
                  Data Collection
                </h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents.analytics}
                    onChange={(e) =>
                      setConsents({ ...consents, analytics: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-[#FFC700] focus:ring-[#FFC700]"
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isDayMode ? "text-neutral-800" : "text-white"
                      }`}
                    >
                      Anonymous Analytics
                    </span>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDayMode ? "text-neutral-500" : "text-neutral-500"
                      }`}
                    >
                      Help improve VentVault with anonymous usage data
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
                    className="mt-1 w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-[#FFC700] focus:ring-[#FFC700]"
                  />
                  <div>
                    <span
                      className={`text-sm font-medium ${
                        isDayMode ? "text-neutral-800" : "text-white"
                      }`}
                    >
                      Location (City-level)
                    </span>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDayMode ? "text-neutral-500" : "text-neutral-500"
                      }`}
                    >
                      Enable local crisis resources and timezone features
                    </p>
                  </div>
                </label>
              </div>

              {/* Info box */}
              <div
                className={`p-4 rounded-xl ${
                  isDayMode ? "bg-amber-50" : "bg-neutral-800/50"
                }`}
              >
                <p
                  className={`text-xs ${
                    isDayMode ? "text-amber-800" : "text-neutral-400"
                  }`}
                >
                  🔒 <strong>Your privacy is protected:</strong> VentVault never stores the content of your vents. Only anonymous analytics are collected to improve the service.
                </p>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full px-4 py-2.5 bg-[#FFC700] hover:bg-[#e6b300] disabled:opacity-50 text-black font-medium rounded-lg transition-colors"
              >
                {isSaving ? "Saving..." : "Save Preferences"}
              </button>

              {/* Message */}
              {message && (
                <p
                  className={`text-sm text-center ${
                    message.type === "success" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {message.text}
                </p>
              )}

              {/* Data management */}
              <div
                className={`pt-4 border-t ${
                  isDayMode ? "border-neutral-200" : "border-neutral-800"
                }`}
              >
                <h3
                  className={`text-sm font-medium mb-3 ${
                    isDayMode ? "text-neutral-700" : "text-neutral-300"
                  }`}
                >
                  Your Data
                </h3>

                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isDayMode
                        ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                  >
                    Export Data
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                  >
                    Delete All Data
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm && (
                <div
                  className={`p-4 rounded-xl ${
                    isDayMode ? "bg-red-50" : "bg-red-900/20"
                  }`}
                >
                  <p
                    className={`text-sm mb-3 ${
                      isDayMode ? "text-red-800" : "text-red-300"
                    }`}
                  >
                    Are you sure? This will permanently delete all your data and cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
