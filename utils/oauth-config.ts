// Centralized OAuth configuration - single source of truth
// These values should be set via environment variables in production
export const OAUTH_CONFIG = {
  url: process.env.EXPO_PUBLIC_OAUTH_URL || "https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token",
  clientId: process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID || "",
  clientSecret: process.env.OAUTH_CLIENT_SECRET || "",
  scope: process.env.EXPO_PUBLIC_OAUTH_SCOPE || "",
} as const;

export interface TokenCache {
  token: string;
  expiresAt: number;
  createdAt?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Build URL-encoded body for token request
export function buildTokenRequestBody(): string {
  return `grant_type=client_credentials&client_id=${encodeURIComponent(OAUTH_CONFIG.clientId)}&client_secret=${encodeURIComponent(OAUTH_CONFIG.clientSecret)}&scope=${encodeURIComponent(OAUTH_CONFIG.scope)}`;
}
