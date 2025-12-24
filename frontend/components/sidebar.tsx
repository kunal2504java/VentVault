"use client"

import Link from "next/link"
import { Logo } from "./logo"

interface SidebarProps {
  onNewVent: () => void
  isDayMode?: boolean
}

export function Sidebar({ onNewVent, isDayMode = false }: SidebarProps) {
  return (
    <>
      {/* Main sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-52 flex flex-col transition-all duration-500 ${isDayMode
            ? "bg-gradient-to-b from-stone-50/95 via-amber-50/90 to-stone-100/95"
            : "bg-gradient-to-b from-neutral-950/95 via-neutral-900/95 to-stone-950/95"
          } backdrop-blur-xl`}
        style={{
          zIndex: 9999,
          pointerEvents: "auto",
        }}
      >
        {/* Header with Logo */}
        <div className="p-5 pt-6">
          <Link href="/" className="block">
            <Logo className="w-24 opacity-80 hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        {/* Divider */}
        <div
          className={`mx-5 h-px ${isDayMode ? "bg-neutral-200/60" : "bg-neutral-800/60"
            }`}
        />

        {/* Main Actions */}
        <div className="flex-1 flex flex-col p-4 pt-6 space-y-3">
          {/* New Vent - Primary action */}
          <button
            onClick={() => {
              console.log("Sidebar new vent clicked")
              onNewVent()
            }}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all duration-300 ${isDayMode
                ? "bg-neutral-900 text-white hover:bg-neutral-800"
                : "bg-white/10 text-white border border-white/10 hover:bg-white/15 hover:border-white/20"
              }`}
            title="New vent"
            aria-label="Start a new vent"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span>New vent</span>
          </button>

          {/* Showing Up link */}
          <Link
            href="/showing-up"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all duration-300 ${isDayMode
                ? "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                : "text-neutral-500 hover:bg-neutral-800/40 hover:text-neutral-300"
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-4 h-4"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                strokeLinecap="round"
                d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
              />
            </svg>
            <span>Showing up</span>
          </Link>

          {/* Mood Map link */}
          <Link
            href="/mood-map"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs tracking-wider transition-all duration-300 ${isDayMode
                ? "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                : "text-neutral-500 hover:bg-neutral-800/40 hover:text-neutral-300"
              }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <span>Mood map</span>
          </Link>
        </div>

        {/* Bottom section */}
        <div className="p-4 pb-6">
          <div
            className={`mx-1 h-px mb-4 ${isDayMode ? "bg-neutral-200/60" : "bg-neutral-800/60"
              }`}
          />

          {/* Gentle reminder */}
          <p
            className={`text-center font-sentient italic text-xs leading-relaxed transition-colors duration-500 ${isDayMode ? "text-neutral-400" : "text-neutral-600"
              }`}
          >
            Take your time.
          </p>
        </div>
      </aside>

      {/* Spacer to push content right */}
      <div className="w-52 flex-shrink-0" />
    </>
  )
}
