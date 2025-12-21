"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { X } from "lucide-react"

interface RateLimitModalProps {
  isOpen: boolean
  onClose: () => void
  isDayMode: boolean
}

export function RateLimitModal({ isOpen, onClose, isDayMode }: RateLimitModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={`relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl ${
          isDayMode
            ? "bg-white border border-neutral-200"
            : "bg-neutral-900 border border-neutral-800"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDayMode
              ? "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div 
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255, 199, 0, 0.15)" }}
          >
            <span className="text-3xl">💭</span>
          </div>

          {/* Title */}
          <h2
            className={`text-2xl font-sentient mb-3 ${
              isDayMode ? "text-neutral-800" : "text-white"
            }`}
          >
            You've used your free vents
          </h2>

          {/* Message */}
          <p
            className={`text-base font-mono mb-8 ${
              isDayMode ? "text-neutral-600" : "text-neutral-400"
            }`}
          >
            Sign in to continue venting or come back tomorrow for more free sessions.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <SignInButton mode="modal">
              <button
                className="w-full py-3 px-6 rounded-full font-mono text-sm tracking-wider transition-all duration-300 text-black hover:opacity-90"
                style={{ backgroundColor: "#FFC700" }}
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                className={`w-full py-3 px-6 rounded-full font-mono text-sm tracking-wider border transition-all duration-300 ${
                  isDayMode
                    ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                    : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                Create Account
              </button>
            </SignUpButton>
          </div>

          {/* Footer note */}
          <p
            className={`mt-6 text-xs font-mono ${
              isDayMode ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            Signed-in users get 25 vents per day
          </p>
        </div>
      </div>
    </div>
  )
}
