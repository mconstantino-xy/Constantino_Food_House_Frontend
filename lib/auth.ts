
import { CONFIG } from "./config"
import { jwtDecode } from "jwt-decode"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null

  return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null

  return localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN)
}

export function setTokens(
  accessToken: string,
  refreshToken?: string
): void {
  localStorage.setItem(
    CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    accessToken
  )

  if (refreshToken) {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
      refreshToken
    )
  }
}

export function clearTokens(): void {
  localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export function getCurrentUserId(): number | null {
  const token = getAccessToken()

  if (!token) return null

  try {
    const decoded = jwtDecode<{ sub: number }>(token)
    return decoded.sub
  } catch {
    return null
  }
}