import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import createContextHook from '@nkzw/create-context-hook';

export type UserRole = 'admin' | 'tester';

export interface User {
  username: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasSavedCredentials: boolean;
  savedUsername: string | null;
  loginWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  canUseBiometrics: boolean;
}

const USERS: Record<string, { password: string; role: UserRole }> = {
  admin: { password: 'Eco@09', role: 'admin' },
  tester: { password: 'Eco01', role: 'tester' },
};

const AUTH_STORAGE_KEY = '@stainid_auth_user';
const CREDENTIALS_USERNAME_KEY = 'stainid_username';
const CREDENTIALS_PASSWORD_KEY = 'stainid_password';

const [AuthProviderComponent, useAuthHook] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('[Auth] Loading stored user...');
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as User;
          console.log('[Auth] Found stored user:', parsedUser.username);
          setUser(parsedUser);
        } else {
          console.log('[Auth] No stored user found');
        }

        // Check for saved credentials
        if (Platform.OS !== 'web') {
          const storedUsername = await SecureStore.getItemAsync(CREDENTIALS_USERNAME_KEY);
          const storedPassword = await SecureStore.getItemAsync(CREDENTIALS_PASSWORD_KEY);
          if (storedUsername && storedPassword) {
            console.log('[Auth] Found saved credentials for:', storedUsername);
            setHasSavedCredentials(true);
            setSavedUsername(storedUsername);
          }

          // Check biometrics availability
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          setCanUseBiometrics(hasHardware && isEnrolled);
          console.log('[Auth] Biometrics available:', hasHardware && isEnrolled);
        }
      } catch (error) {
        console.error('[Auth] Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[Auth] Login attempt for:', username);
    
    const userConfig = USERS[username.toLowerCase()];
    if (!userConfig || userConfig.password !== password) {
      console.log('[Auth] Invalid credentials');
      return { success: false, error: 'Invalid username or password' };
    }

    const newUser: User = {
      username: username.toLowerCase(),
      role: userConfig.role,
    };

    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      
      // Save credentials to SecureStore
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(CREDENTIALS_USERNAME_KEY, username.toLowerCase());
        await SecureStore.setItemAsync(CREDENTIALS_PASSWORD_KEY, password);
        setHasSavedCredentials(true);
        setSavedUsername(username.toLowerCase());
        console.log('[Auth] Credentials saved to SecureStore');
      }
      
      setUser(newUser);
      console.log('[Auth] Login successful:', newUser.username, 'Role:', newUser.role);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Error saving user:', error);
      return { success: false, error: 'Failed to save session' };
    }
  };

  const loginWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    console.log('[Auth] Attempting biometric login...');
    
    if (Platform.OS === 'web') {
      return { success: false, error: 'Biometrics not available on web' };
    }

    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (!biometricAuth.success) {
        console.log('[Auth] Biometric auth failed');
        return { success: false, error: 'Authentication failed' };
      }

      const storedUsername = await SecureStore.getItemAsync(CREDENTIALS_USERNAME_KEY);
      const storedPassword = await SecureStore.getItemAsync(CREDENTIALS_PASSWORD_KEY);

      if (!storedUsername || !storedPassword) {
        return { success: false, error: 'No saved credentials found' };
      }

      return login(storedUsername, storedPassword);
    } catch (error) {
      console.error('[Auth] Biometric login error:', error);
      return { success: false, error: 'Biometric authentication failed' };
    }
  };

  const logout = async () => {
    console.log('[Auth] Logging out...');
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Error during logout:', error);
    }
  };

  const isAdmin = user?.role === 'admin';

  return {
    user,
    isLoading,
    login,
    logout,
    isAdmin,
    hasSavedCredentials,
    savedUsername,
    loginWithBiometrics,
    canUseBiometrics,
  };
});

export const AuthProvider = AuthProviderComponent;
export const useAuth = useAuthHook;
