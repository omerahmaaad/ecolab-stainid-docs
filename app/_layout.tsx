import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StainProvider } from "@/hooks/stain-context";
import { LanguageProvider } from "@/hooks/language-context";
import { AuthProvider, useAuth } from "@/hooks/auth-context";
import LoginScreen from "@/app/login";
import { trpc, trpcClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { migrateFeedbackToFileStorage } from "@/utils/feedback-storage";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'offlineFirst',
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="camera" options={{ headerShown: false }} />
      <Stack.Screen 
        name="analysis" 
        options={{ 
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="models" 
        options={{ 
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="statistics" 
        options={{ 
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="gallery" 
        options={{ 
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom"
        }} 
      />
    </Stack>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('[RootLayout] Starting initialization...');

        // Migrate feedback images from inline base64 to file storage
        // This prevents the Android cursor window size limit error
        try {
          const migrationResult = await migrateFeedbackToFileStorage();
          if (migrationResult.migrated > 0) {
            console.log(`[RootLayout] Migrated ${migrationResult.migrated} feedback entries to file storage`);
          }
        } catch (migrationError) {
          console.warn('[RootLayout] Feedback migration failed:', migrationError);
          // Non-critical, continue app initialization
        }

        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
        console.log('[RootLayout] App ready');
      } catch (err) {
        console.error('[RootLayout] Init error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setAppReady(true);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const wakeUpBackend = async (retries = 5): Promise<boolean> => {
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      if (!baseUrl) return false;
      
      for (let i = 0; i < retries && isMounted; i++) {
        try {
          console.log(`[WakeUp] Attempt ${i + 1}/${retries}...`);
          const response = await fetch(`${baseUrl}/api`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          
          if (response.ok) {
            console.log('[WakeUp] Backend is awake!');
            return true;
          }
          
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            console.log(`[WakeUp] Backend waking up (${response.status}), waiting...`);
            await new Promise(r => setTimeout(r, 2000 + i * 1000));
          }
        } catch {
          console.log('[WakeUp] Network error, retrying...');
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      return false;
    };

    const keepBackendAlive = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
        if (!baseUrl) return;
        
        const response = await fetch(`${baseUrl}/api`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (response.ok) {
          console.log('[KeepAlive] Backend ping successful');
        }
      } catch {
        console.log('[KeepAlive] Backend ping failed');
      }
    };

    wakeUpBackend();
    
    const interval = setInterval(keepBackendAlive, 2 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
              <LanguageProvider>
                <StainProvider>
                  <AuthGate />
                </StainProvider>
              </LanguageProvider>
            </AuthProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    textAlign: 'center',
  },
});