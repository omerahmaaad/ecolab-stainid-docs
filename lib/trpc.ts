import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { Platform } from 'react-native';

import type { AppRouter } from "@/backend/trpc/router-types";
import { getValidToken } from "@/utils/token-manager";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  console.log(`[trpc] Platform: ${Platform.OS}, Version: ${Platform.Version}`);

  if (!url || url.trim() === '') {
    console.error('[trpc] CRITICAL: EXPO_PUBLIC_RORK_API_BASE_URL is not set!');
    console.error('[trpc] Available env vars:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
    console.error('[trpc] Using empty string as fallback - API routes will be relative');
    return '';
  }

  const trimmedUrl = url.trim();
  console.log(`[trpc] Using base URL: ${trimmedUrl} on ${Platform.OS}`);
  return trimmedUrl;
};

const isRetryableError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  const name = error?.name?.toLowerCase() || '';
  
  return (
    name === 'aborterror' ||
    name === 'typeerror' ||
    message.includes('network') ||
    message.includes('failed') ||
    message.includes('timeout') ||
    message.includes('aborted') ||
    message.includes('connection') ||
    message.includes('socket') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('fetch')
  );
};

const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit, retries = 12): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  const urlString = typeof url === 'string' ? url : url.toString();

  try {
    console.log(`[trpc] [${Platform.OS}] Making request to: ${urlString}`);
    console.log(`[trpc] [${Platform.OS}] Request method: ${options?.method || 'GET'}`);
    console.log(`[trpc] [${Platform.OS}] Body size: ${options?.body ? String(options.body).length : 0} bytes`);

    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const elapsed = Date.now() - startTime;
    clearTimeout(timeoutId);

    console.log(`[trpc] [${Platform.OS}] Response received in ${elapsed}ms, status: ${response.status}`);

    if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
      const delay = Math.min(1500 + (13 - retries) * 500, 8000);
      console.log(`[trpc] [${Platform.OS}] Backend waking up (${response.status}), retrying in ${delay}ms... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    // Check if response is actually JSON before returning
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      console.error(`[trpc] [${Platform.OS}] Error response - Status: ${response.status}, Content-Type: ${contentType}`);
      if (contentType && !contentType.includes('application/json')) {
        const textContent = await response.text();
        console.error(`[trpc] [${Platform.OS}] Non-JSON error response: ${textContent.substring(0, 500)}`);
        throw new Error(`Backend returned ${response.status} error. The service may be unavailable. Please try again later.`);
      }
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    console.error(`[trpc] [${Platform.OS}] ===== FETCH ERROR =====`);
    console.error(`[trpc] [${Platform.OS}] URL: ${urlString}`);
    console.error(`[trpc] [${Platform.OS}] Error name: ${error?.name}`);
    console.error(`[trpc] [${Platform.OS}] Error message: ${error?.message}`);
    console.error(`[trpc] [${Platform.OS}] Error stack: ${error?.stack?.substring(0, 300)}`);
    console.error(`[trpc] [${Platform.OS}] =======================`);

    if (isRetryableError(error) && retries > 0) {
      const delay = Math.min(1500 + (13 - retries) * 500, 6000);
      console.log(`[trpc] [${Platform.OS}] Retryable error, retrying in ${delay}ms... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    console.error(`[trpc] [${Platform.OS}] Fetch error (no more retries): ${error.message}`);
    throw error;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: fetchWithRetry,
      async headers() {
        console.log('[trpc] Preparing headers for request...');
        try {
          const token = await getValidToken();
          console.log('[trpc] Got token, length:', token?.length || 0);
          if (token && token.length > 0) {
            return {
              Authorization: `Bearer ${token}`,
            };
          }
          console.log('[trpc] No token available, using public access');
          return {};
        } catch (error) {
          console.log('[trpc] Token fetch failed, proceeding without auth:', error instanceof Error ? error.message : 'Unknown error');
          return {};
        }
      },
    }),
  ],
});
