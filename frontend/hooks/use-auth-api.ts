"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect } from "react"
import { setAuthTokenGetter } from "@/lib/api-client"

/**
 * Hook to integrate Clerk authentication with the API client.
 * Call this once in your app to enable authenticated API requests.
 */
export function useAuthApi() {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    // Set the token getter for the API client
    setAuthTokenGetter(async () => {
      if (!isSignedIn) return null
      return await getToken()
    })
  }, [getToken, isSignedIn])

  return { isSignedIn }
}
