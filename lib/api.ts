
import { CONFIG } from "./config"
import { getAccessToken } from "./auth"

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()

  const headers = new Headers(options.headers)

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

 if (token) {
  headers.set("Authorization", `Bearer ${token.trim()}`)
}

  const response = await fetch(
    `${CONFIG.API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  )

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
    )
  }

  return data as T
}
