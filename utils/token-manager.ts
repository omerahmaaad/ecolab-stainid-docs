import { Platform } from 'react-native';
import { OAUTH_CONFIG, TokenCache, TokenResponse, buildTokenRequestBody } from './oauth-config';

const PLATFORM_TIMEOUTS: Record<string, number> = {
  ios: 30000,
  android: 45000,
  web: 15000,
};

function getPlatformTimeout(): number {
  return PLATFORM_TIMEOUTS[Platform.OS] ?? PLATFORM_TIMEOUTS.web;
}

let tokenCache: (TokenCache & { createdAt: number }) | null = null;

export async function fetchAccessToken(forceRefresh: boolean = false): Promise<string> {
  if (Platform.OS === 'web') {
    console.log('[TokenManager-web] Skipping OAuth token for web platform (backend uses public procedures)');
    return '';
  }

  const now = Date.now();
  
  if (!forceRefresh && tokenCache && now < tokenCache.expiresAt) {
    console.log(`[TokenManager-${Platform.OS}] Using cached token (age: ${Math.floor((now - tokenCache.createdAt) / 1000)}s)`);
    return tokenCache.token;
  }
  
  if (forceRefresh) tokenCache = null;
  console.log(`[TokenManager-${Platform.OS}] Fetching new token...`);

  try {
    const controller = new AbortController();
    const timeout = getPlatformTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log(`[TokenManager-${Platform.OS}] Timeout set to ${timeout}ms`);

    const response = await fetch(OAUTH_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: buildTokenRequestBody(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TokenManager-${Platform.OS}] Token fetch failed:`, response.status);
      
      if (response.status === 403 && errorText.includes('Zscaler')) {
        console.error(`[TokenManager-${Platform.OS}] Blocked by corporate firewall`);
        throw new Error('Unable to authenticate due to network restrictions. Please use a different network or contact your IT administrator.');
      }
      
      if (Platform.OS === 'ios' && response.status === 0) {
        throw new Error('Network connection failed on iOS. Please check your internet connection and App Transport Security settings.');
      }
      
      throw new Error(`Failed to fetch token: ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    const now = Date.now();
    console.log(`[TokenManager-${Platform.OS}] ✅ Success. Expires in: ${data.expires_in}s`);

    tokenCache = {
      token: data.access_token,
      expiresAt: now + (data.expires_in - 300) * 1000,
      createdAt: now,
    };

    return data.access_token;
  } catch (error: any) {
    console.error(`[TokenManager-${Platform.OS}] Error:`, error?.message);
    
    if (error?.message?.includes('network restrictions') || error?.message?.includes('Zscaler')) {
      throw error;
    }
    
    if (error?.name === 'AbortError') {
      const timeoutSec = Math.floor(getPlatformTimeout() / 1000);
      throw new Error(`Request timeout after ${timeoutSec}s on ${Platform.OS}. The authentication service is not responding. Please check your internet connection and try again.`);
    }
    
    if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
      const platformHint = Platform.OS === 'ios' 
        ? ' Please check your internet connection and App Transport Security settings.'
        : ' Please check your internet connection and try again.';
      throw new Error(`Network connection failed on ${Platform.OS}.${platformHint}`);
    }
    
    if (error?.message?.toLowerCase()?.includes('cors')) {
      throw new Error('Authentication service is not accessible. Please use the mobile app or contact support.');
    }
    
    throw new Error(error?.message || 'Failed to fetch access token. Please try again.');
  }
}

export async function getValidToken(): Promise<string> {
  try {
    return await fetchAccessToken();
  } catch (error) {
    console.log('[TokenManager] Token fetch failed, returning empty token for public access:', error instanceof Error ? error.message : 'Unknown error');
    return '';
  }
}

export function clearTokenCache(): void {
  console.log('[TokenManager] Clearing token cache');
  tokenCache = null;
}

export function getTokenAge(): number | null {
  if (!tokenCache) return null;
  return Math.floor((Date.now() - tokenCache.createdAt) / 1000);
}

export function isTokenValid(): boolean {
  if (!tokenCache) return false;
  return Date.now() < tokenCache.expiresAt;
}
