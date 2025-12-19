"use client"

import { useEffect, useState } from "react"
import { checkHealth } from "@/lib/api-client"

export function BackendStatus() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const healthy = await checkHealth()
      setIsHealthy(healthy)
    }

    check()
    const interval = setInterval(check, 30000) // Check every 30s

    return () => clearInterval(interval)
  }, [])

  if (isHealthy === null) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 ${
          isHealthy
            ? "bg-green-500/10 text-green-500 border border-green-500/20"
            : "bg-red-500/10 text-red-500 border border-red-500/20"
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`} />
        {isHealthy ? "Backend Connected" : "Backend Offline"}
      </div>
    </div>
  )
}
