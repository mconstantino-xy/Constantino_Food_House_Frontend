
import { CONFIG } from "./config";

export type UserRole = "admin" | "user";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(
    CONFIG.STORAGE_KEYS.ACCESS_TOKEN
  );

  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
};

const getTokenPayload = (): any | null => {
  const token = getAccessToken();

  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) return null;

    const normalized = payloadBase64
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getCurrentUserId = (): number | null => {
  const payload = getTokenPayload();

  if (!payload) return null;

  const userId =
    payload.sub ??
    payload.id ??
    payload.userId;

  return userId ? Number(userId) : null;
};

export const getCurrentUserRole = (): UserRole | null => {
  const payload = getTokenPayload();

  if (!payload?.role) return null;

  const role = String(payload.role).toLowerCase();

  if (role === "admin" || role === "user") {
    return role;
  }

  return null;
};

export const setTokens = (
  accessToken?: string,
  refreshToken?: string
): void => {
  if (typeof window === "undefined") return;

  if (
    accessToken &&
    accessToken !== "undefined" &&
    accessToken !== "null"
  ) {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      accessToken
    );
  } else {
    localStorage.removeItem(
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN
    );
  }

  if (
    refreshToken &&
    refreshToken !== "undefined" &&
    refreshToken !== "null"
  ) {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
      refreshToken
    );
  } else {
    localStorage.removeItem(
      CONFIG.STORAGE_KEYS.REFRESH_TOKEN
    );
  }
};

export const clearTokens = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
