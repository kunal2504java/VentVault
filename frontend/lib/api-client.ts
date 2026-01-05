/**
 * VentVault API Client
 * Handles streaming responses from backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Session storage key
const SESSION_ID_KEY = "ventvault_session_id"
const USER_ID_KEY = "ventvault_user_id"

export interface VentRequest {
  mode: "text" | "voice"
  content: string
}

export interface VentMetadata {
  sessionId: string
  userId: string
  remainingVents: number
}

// Auth token getter (set by ClerkProvider)
let getAuthToken: (() => Promise<string | null>) | null = null

/**
 * Set the auth token getter function (called from React component)
 */
export function setAuthTokenGetter(getter: () => Promise<string | null>): void {
  getAuthToken = getter
}

/**
 * Get stored session ID
 */
function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(SESSION_ID_KEY)
}

/**
 * Store session ID
 */
function storeSessionId(sessionId: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_ID_KEY, sessionId)
}

/**
 * Store user ID
 */
function storeUserId(userId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_ID_KEY, userId)
}

/**
 * Stream vent response from backend
 * Uses Server-Sent Events for real-time token streaming
 */
export async function streamVent(
  request: VentRequest,
  onToken: (token: string) => void,
  onComplete: (metadata: VentMetadata) => void,
  onError: (error: string) => void,
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Include session ID if we have one (for conversation continuity)
    const existingSessionId = getStoredSessionId()
    if (existingSessionId) {
      headers["X-Session-ID"] = existingSessionId
    }

    // Include auth token if user is signed in
    if (getAuthToken) {
      const token = await getAuthToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/vent`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Daily vent limit reached. Sign in for more vents.")
      }
      throw new Error(`API error: ${response.status}`)
    }

    // Extract metadata from headers
    const sessionId = response.headers.get("X-Session-ID") || ""
    const userId = response.headers.get("X-User-ID") || ""
    const remainingVents = parseInt(response.headers.get("X-Remaining-Vents") || "0")

    // Store IDs for future requests
    if (sessionId) storeSessionId(sessionId)
    if (userId) storeUserId(userId)

    // Read streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No response body")
    }

    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // Decode chunk
      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages
      const lines = buffer.split("\n")
      buffer = lines.pop() || "" // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6) // Remove "data: " prefix

          if (data === "[DONE]") {
            onComplete({ sessionId, userId, remainingVents })
            return
          }

          if (data === "[ERROR]") {
            throw new Error("LLM streaming error")
          }

          // Send token to callback
          onToken(data)
        }
      }
    }
  } catch (error) {
    console.error("Vent API error:", error)
    onError(error instanceof Error ? error.message : "Failed to connect to server")
  }
}

/**
 * Clear session (for new vent)
 */
export function clearSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_ID_KEY)
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    return data.status === "healthy" || data.status === "degraded"
  } catch {
    return false
  }
}

/**
 * Presence data for Showing Up page
 */
export interface PresenceData {
  days_showed_up: number
  check_in_pattern: boolean[]
  insights: {
    time_based: string | null
    gap_based: string | null
  }
  message: string
}

/**
 * Get presence data for the Showing Up page
 */
export async function getPresenceData(): Promise<PresenceData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/presence`, {
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

/**
 * Get AssemblyAI token for real-time voice transcription
 */
export async function getAssemblyToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assembly/token`, {
      credentials: "include",
    })

    if (!response.ok) {
      console.log("AssemblyAI token not available:", response.status)
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.log("Failed to get AssemblyAI token:", error)
    return null
  }
}

/**
 * Mood map emotion data
 */
export interface EmotionData {
  emotion: string
  percentage: number
}

/**
 * Mood map data for emotional state visualization
 */
export interface MoodMapData {
  has_data: boolean
  emotional_load: EmotionData[]
  processing: EmotionData[]
  release: EmotionData[]
  positive_shifts: EmotionData[]
  conditional: EmotionData[]
  time_data: {
    most_active_day: string
    most_active_time: string
    time_of_day_label: string
  } | null
  insight: {
    type: string
    description: string
  }
  most_felt_emotion: {
    emotion: string
    percentage: number
  } | null
}

/**
 * Get mood map data for the Mood Map page
 */
export async function getMoodMapData(): Promise<MoodMapData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mood-map`, {
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}
