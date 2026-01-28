import { useState, useEffect, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StainImages {
  withFlash: string;
  withoutFlash: string;
}

type AIModel = 'gemma' | 'sonnet';
type APILanguage = 'english' | 'spanish';

interface StainContextType {
  images: StainImages | null;
  setImages: (images: StainImages) => void;
  clearImages: () => void;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  aiModel: AIModel;
  setAIModel: (model: AIModel) => void;
  apiLanguage: APILanguage;
  setAPILanguage: (language: APILanguage) => void;
}

const STORAGE_KEY = '@stain_settings';

const [StainProviderComponent, useStain] = createContextHook<StainContextType>(() => {
  const [images, setImagesState] = useState<StainImages | null>(null);
  const [selectedModel, setSelectedModelState] = useState<string>("databricks-claude-sonnet");
  const [aiModel, setAIModelState] = useState<AIModel>('sonnet');
  const [apiLanguage, setAPILanguageState] = useState<APILanguage>('english');

  // Load saved settings from local storage
  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.selectedModel) setSelectedModelState(settings.selectedModel);
          if (settings.aiModel) setAIModelState(settings.aiModel);
          if (settings.apiLanguage) setAPILanguageState(settings.apiLanguage);
          console.log('[StainContext] Loaded settings from local storage');
        }
      } catch (e) {
        console.error('[StainContext] Load settings error:', e);
      }
    };
    
    loadSettings();
    return () => { mounted = false; };
  }, []);

  const saveSettings = useCallback(async (updates: Partial<{ selectedModel: string; aiModel: AIModel; apiLanguage: APILanguage }>) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const newSettings = { ...current, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      console.log('[StainContext] Saved settings to local storage');
    } catch (e) {
      console.error('[StainContext] Save settings error:', e);
    }
  }, []);

  const setImages = useCallback((imgs: StainImages) => {
    setImagesState(imgs);
  }, []);

  const clearImages = useCallback(() => {
    setImagesState(null);
  }, []);

  const setSelectedModel = useCallback(async (modelId: string) => {
    if (modelId?.trim()) {
      setSelectedModelState(modelId);
      await saveSettings({ selectedModel: modelId });
    }
  }, [saveSettings]);

  const setAIModel = useCallback(async (model: AIModel) => {
    if (model) {
      setAIModelState(model);
      await saveSettings({ aiModel: model });
    }
  }, [saveSettings]);

  const setAPILanguage = useCallback(async (language: APILanguage) => {
    if (language) {
      setAPILanguageState(language);
      await saveSettings({ apiLanguage: language });
    }
  }, [saveSettings]);

  return {
    images,
    setImages,
    clearImages,
    selectedModel,
    setSelectedModel,
    aiModel,
    setAIModel,
    apiLanguage,
    setAPILanguage,
  };
});

export const StainProvider = StainProviderComponent;
export { useStain };