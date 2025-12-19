/**
 * VentVault API Client
 * Handles streaming responses from backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface VentRequest {
  mode: "text" | "voice"
  content: string
}

export interface VentMetadata {
  sessionId: string
  remainingVents: number
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
    const response = await fetch(`${API_BASE_URL}/api/vent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    const remainingVents = parseInt(response.headers.get("X-Remaining-Vents") || "0")

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
            onComplete({ sessionId, remainingVents })
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
 * Health check endpoint
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}
