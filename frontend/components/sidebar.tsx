"use client"

import { PenSquare } from "lucide-react"

interface SidebarProps {
  onNewVent: () => void
  isDayMode?: boolean
}

export function Sidebar({ onNewVent, isDayMode = false }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full w-16 flex flex-col items-center py-6 transition-colors duration-300 ${
        isDayMode
          ? "bg-stone-100/90 border-r border-stone-200/50"
          : "bg-neutral-900/90 border-r border-neutral-800/50"
      } backdrop-blur-md`}
      style={{ 
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {/* New Vent Button */}
      <button
        onClick={() => {
          console.log("Sidebar new vent clicked")
          onNewVent()
        }}
        className="p-3 rounded-xl transition-all duration-200 hover:scale-105 cursor-pointer"
        style={{
          backgroundColor: "#FFC700",
          color: "#000",
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 10000
        }}
        title="New vent"
        aria-label="Start a new vent"
      >
        <PenSquare size={22} />
      </button>
    </aside>
  )
}
