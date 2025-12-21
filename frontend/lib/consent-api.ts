/**
 * Consent and Privacy API client for VentVault
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface ConsentStatus {
  analytics: boolean
  location: boolean
  save_history: boolean
  marketing: boolean
}

export interface LocationData {
  country_code: string | null
  country_name: string | null
  region: string | null
  city: string | null
  timezone: string | null
}

export interface ConsentResponse {
  user_id: string
  consents: ConsentStatus
}

export interface LocationResponse {
  has_consent: boolean
  location: LocationData | null
}

/**
 * Get current consent status
 */
export async function getConsents(): Promise<ConsentResponse> {
  const response = await fetch(`${API_BASE}/api/consent`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch consent status")
  }

  return response.json()
}

/**
 * Update consent preferences
 */
export async function updateConsents(
  consents: Partial<ConsentStatus>
): Promise<ConsentResponse> {
  const response = await fetch(`${API_BASE}/api/consent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ consents }),
  })

  if (!response.ok) {
    throw new Error("Failed to update consent")
  }

  return response.json()
}

/**
 * Get user location (requires consent)
 */
export async function getLocation(): Promise<LocationResponse> {
  const response = await fetch(`${API_BASE}/api/location`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch location")
  }

  return response.json()
}

/**
 * Export all user data (GDPR)
 */
export async function exportUserData(): Promise<object> {
  const response = await fetch(`${API_BASE}/api/user/data`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to export data")
  }

  const result = await response.json()
  return result.data
}

/**
 * Delete all user data (GDPR)
 */
export async function deleteUserData(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/user/data`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to delete data")
  }
}

// Local storage keys for consent state
const CONSENT_STORAGE_KEY = "ventvault_consent"
const CONSENT_SHOWN_KEY = "ventvault_consent_shown"

/**
 * Check if consent banner has been shown
 */
export function hasConsentBeenShown(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(CONSENT_SHOWN_KEY) === "true"
}

/**
 * Mark consent banner as shown
 */
export function markConsentShown(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CONSENT_SHOWN_KEY, "true")
}

/**
 * Get locally stored consent preferences
 */
export function getLocalConsent(): Partial<ConsentStatus> | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Store consent preferences locally
 */
export function setLocalConsent(consents: Partial<ConsentStatus>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consents))
}
