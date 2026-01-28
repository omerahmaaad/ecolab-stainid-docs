import createContextHook from '@nkzw/create-context-hook';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '@/locales/en';
import es from '@/locales/es';

const LANGUAGE_KEY = 'app-language';

const [LanguageProviderComponent, useLanguage] = createContextHook(() => {
  const [locale, setLocale] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  const i18n = useMemo(() => new I18n({
    en,
    es,
  }), []);

  i18n.locale = locale;
  i18n.enableFallback = true;
  i18n.defaultLocale = 'en';

  const loadSavedLanguage = useCallback(async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        setLocale(savedLanguage);
      } else {
        const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
        const supportedLocale = ['en', 'es'].includes(deviceLocale) ? deviceLocale : 'en';
        setLocale(supportedLocale);
      }
    } catch (error) {
      console.error('Failed to load saved language:', error);
      setLocale('en');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedLanguage();
  }, [loadSavedLanguage]);

  const changeLanguage = useCallback(async (newLocale: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLocale);
      setLocale(newLocale);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = useCallback((key: string, options?: any) => {
    return i18n.t(key, options);
  }, [i18n]);

  return useMemo(() => ({
    locale,
    changeLanguage,
    t,
    isLoading,
  }), [locale, changeLanguage, t, isLoading]);
});

export const LanguageProvider = LanguageProviderComponent;
export { useLanguage };
