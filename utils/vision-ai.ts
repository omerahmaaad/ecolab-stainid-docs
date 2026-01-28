import { trpcClient } from '@/lib/trpc';
import { stripBase64Prefix } from './image-utils';
import { getAlternativeTreatment, STAIN_TYPES_LIST } from './stain-data';

export interface StainAnalysisResult {
  detected: boolean;
  stainType?: string;
  category?: string;
  description?: string;
  treatments?: string[];
}

export interface VisionModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  isLocal: boolean;
  size?: string;
  accuracy?: number;
}

export async function getStainTypesList(): Promise<{name: string; category: string}[]> {
  return STAIN_TYPES_LIST;
}

export const AVAILABLE_MODELS: VisionModel[] = [
  {
    id: "databricks-claude-sonnet",
    name: "Ecolab Stain ID with Claude (Databricks)",
    description: "Enterprise-grade stain identification powered by Ecolab knowledge base",
    provider: "Ecolab Digital AI powered by Databricks",
    isLocal: false,
    accuracy: 92
  },
  {
    id: "databricks-gemma",
    name: "Ecolab Stain ID with Gemma (Databricks)",
    description: "Fast stain identification powered by Ecolab knowledge base",
    provider: "Ecolab Digital AI powered by Databricks",
    isLocal: false,
    accuracy: 85
  }
];

// Cache for recent analyses to avoid duplicate API calls
const analysisCache = new Map<string, { result: StainAnalysisResult; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const MAX_CACHE_SIZE = 3; // Maximum 3 cached results


// Generate cache key from images
function generateCacheKey(imageWithFlash: string, imageWithoutFlash: string, model: string): string {
  const flashHash = imageWithFlash.substring(0, 100) + imageWithFlash.length;
  const noFlashHash = imageWithoutFlash.substring(0, 100) + imageWithoutFlash.length;
  return `${model}-${flashHash}-${noFlashHash}`;
}

export async function analyzeStain(
  imageWithFlash: string,
  imageWithoutFlash: string,
  selectedModel: string = "databricks-claude-sonnet",
  language: string = "en",
  aiModel: string = "gemma",
  apiLanguage: string = "english"
): Promise<StainAnalysisResult> {
  try {
    if (!imageWithFlash || !imageWithoutFlash) {
      throw new Error("Both images are required for analysis");
    }

    if (imageWithFlash.length < 100 || imageWithoutFlash.length < 100) {
      throw new Error("Images appear to be corrupted or too small");
    }

    const cacheKey = generateCacheKey(imageWithFlash, imageWithoutFlash, selectedModel);
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Cache] Returning cached result');
      return cached.result;
    }
    
    if (analysisCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(analysisCache.keys())[0];
      analysisCache.delete(oldestKey);
      console.log('[Cache] Cleared oldest entry, size:', analysisCache.size);
    }

    console.log('Analyzing with model:', selectedModel);
    console.log('Image sizes - Flash:', imageWithFlash.length, 'No Flash:', imageWithoutFlash.length);
    console.log('Image preview - Flash first 50:', imageWithFlash.substring(0, 50));
    console.log('Image preview - NoFlash first 50:', imageWithoutFlash.substring(0, 50));
    
    if (imageWithFlash === imageWithoutFlash) {
      console.error('ERROR: Both images are identical! This may reduce analysis quality.');
    }
    
    if (imageWithFlash.length < 1000) {
      console.warn('WARNING: Flash image is suspiciously small:', imageWithFlash.length);
    }
    if (imageWithoutFlash.length < 1000) {
      console.warn('WARNING: No-flash image is suspiciously small:', imageWithoutFlash.length);
    }
    
    const compressedFlash = stripBase64Prefix(imageWithFlash);
    const compressedNoFlash = stripBase64Prefix(imageWithoutFlash);

    console.log('[analyzeStain] Using AI Model:', aiModel);
    console.log('[analyzeStain] Using API Language:', apiLanguage);
    console.log('[analyzeStain] Sending request to backend proxy...');

    let data: any;
    try {
      console.log('[analyzeStain] Starting tRPC mutation call...');
      console.log('[analyzeStain] Image sizes - Flash:', compressedFlash.length, 'NoFlash:', compressedNoFlash.length);

      const startTime = Date.now();
      data = await Promise.race([
        trpcClient.stainAnalysis.analyze.mutate({
          imageWithFlash: compressedFlash,
          imageWithoutFlash: compressedNoFlash,
          aiModel,
          apiLanguage,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
        )
      ]);

      const elapsed = Date.now() - startTime;
      console.log('[analyzeStain] tRPC call completed in', elapsed, 'ms');
    } catch (backendError: any) {
      console.error('[analyzeStain] ===== BACKEND ERROR DETAILS =====');
      console.error('[analyzeStain] Error name:', backendError?.name);
      console.error('[analyzeStain] Error message:', backendError?.message);
      console.error('[analyzeStain] Error code:', backendError?.code);
      console.error('[analyzeStain] Error cause:', backendError?.cause);
      console.error('[analyzeStain] Full error:', JSON.stringify(backendError, Object.getOwnPropertyNames(backendError)));
      console.error('[analyzeStain] ================================');

      // Provide more specific error message based on error type
      let errorDescription = 'The analysis service is temporarily unavailable.';
      if (backendError?.message?.includes('timeout')) {
        errorDescription = 'Request timed out. The server took too long to respond. Please try again.';
      } else if (backendError?.message?.includes('network') || backendError?.message?.includes('Network')) {
        errorDescription = 'Network error. Please check your internet connection and try again.';
      } else if (backendError?.message?.includes('fetch')) {
        errorDescription = 'Failed to connect to server. Please check your internet connection.';
      } else if (backendError?.message) {
        errorDescription = `Server error: ${backendError.message}`;
      }

      const errorResult: StainAnalysisResult = {
        detected: false,
        description: errorDescription,
        treatments: ['Check your internet connection', 'Try again in a few moments', `Debug: ${backendError?.message || 'Unknown error'}`]
      };

      // Cache error result briefly to prevent repeated failed calls
      analysisCache.set(cacheKey, { result: errorResult, timestamp: Date.now() });
      return errorResult;
    }

    console.log('[analyzeStain] Response received from backend');
    console.log('[analyzeStain] Full Databricks response:', JSON.stringify(data).substring(0, 500));
    
    // Parse the AI response into our StainAnalysisResult
    try {
      let jsonText = '';

      // Databricks multiagent response format:
      // { output: [{ content: [{ text: "json string", type: "output_text" }] }] }
      if (selectedModel === "databricks-claude-sonnet" || selectedModel === "databricks-gemma") {
        console.log('[analyzeStain] Full Databricks response:', JSON.stringify(data).substring(0, 500));
        
        const outputArray = data.output;
        if (outputArray && Array.isArray(outputArray) && outputArray.length > 0) {
          const contentArray = outputArray[0].content;
          if (contentArray && Array.isArray(contentArray) && contentArray.length > 0) {
            jsonText = contentArray[0].text || JSON.stringify(data);
            console.log('[analyzeStain] Extracted text from Databricks response:', jsonText.substring(0, 300));
          } else {
            console.log('[analyzeStain] No content array found, using full data');
            jsonText = JSON.stringify(data);
          }
        } else {
          console.log('[analyzeStain] No output array found, trying alternatives');
          jsonText =
            data.choices?.[0]?.message?.content ||
            data.content ||
            data.completion ||
            data.response ||
            data.text ||
            JSON.stringify(data);
        }
      }

      console.log('[analyzeStain] Raw response text:', jsonText.substring(0, 300));
      
      // Remove markdown code blocks if present
      if (jsonText.includes('```json')) {
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
      } else if (jsonText.includes('```')) {
        const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }
      }
      
      // Extract JSON object
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        console.error('[analyzeStain] No valid JSON object found in response');
        console.error('[analyzeStain] Response text:', jsonText.substring(0, 500));
        throw new Error(`AI service returned invalid format. Response: "${jsonText.substring(0, 100)}..."`);
      }
      
      jsonText = jsonText.substring(firstBrace, lastBrace + 1).trim();
      
      console.log('[analyzeStain] Cleaned JSON text:', jsonText.substring(0, 300));
      
      // Validate that jsonText is actually JSON before parsing
      if (!jsonText || jsonText.trim().length === 0) {
        console.error('[analyzeStain] Empty JSON text after extraction');
        throw new Error('AI service returned empty response after processing.');
      }
      
      const trimmedJson = jsonText.trim();
      if (!trimmedJson.startsWith('{') && !trimmedJson.startsWith('[')) {
        console.error('[analyzeStain] Extracted text is not JSON:', trimmedJson.substring(0, 200));
        throw new Error(`AI service returned invalid data: "${trimmedJson.substring(0, 100)}..."`);
      }
      
      let rawResult: any;
      try {
        rawResult = JSON.parse(jsonText);
      } catch (parseErr: any) {
        console.error('[analyzeStain] JSON parse failed:', parseErr.message);
        console.error('[analyzeStain] Failed to parse:', jsonText.substring(0, 500));
        throw new Error(`Failed to parse AI response. The service may be experiencing issues. Please try again.`);
      }
      
      console.log('[analyzeStain] Parsed result keys:', Object.keys(rawResult));
      console.log('[analyzeStain] Parsed result:', JSON.stringify(rawResult).substring(0, 500));

      let finalResult: StainAnalysisResult;

      // Case 1: Multi-agent format: fields like "Stain", "Stain Type", "Ecolab Treatment", "Stain Analysis"
      if (rawResult.Stain || rawResult['Stain']) {
        console.log('[analyzeStain] Detected Databricks multi-agent response format');
        
        const stainName: string = rawResult.Stain || rawResult['Stain'] || 'Unknown';
        const stainTypeField: string =
          rawResult['Stain Type'] || rawResult.StainType || rawResult['StainType'] || 'Unknown';
        const treatmentField: string =
          rawResult['Ecolab Treatment'] || rawResult.EcolabTreatment || rawResult['Treatment'] || '';

        let analysisText: string =
          rawResult['Stain Analysis'] ||
          rawResult.Analysis ||
          rawResult['Analysis'] ||
          rawResult['Reasoning'] ||
          '';

        // Strip headings / labels
        analysisText = analysisText.replace(/^#\s*Analysis\s*:?/im, '').trim();
        analysisText = analysisText.replace(/^Analysis\s*:?/im, '').trim();
        analysisText = analysisText.replace(/^Reasoning\s*:?/im, '').trim();

        if (analysisText.includes('Visual Analysis (Internal):')) {
          const internalStart = analysisText.indexOf('Visual Analysis (Internal):');
          const reasoningLabel = analysisText.indexOf('Reasoning:', internalStart);
          if (reasoningLabel !== -1) {
            analysisText = analysisText.substring(reasoningLabel + 'Reasoning:'.length).trim();
          } else {
            analysisText = analysisText.substring(internalStart + 'Visual Analysis (Internal):'.length).trim();
            const doubleNewline = analysisText.indexOf('\n\n');
            if (doubleNewline !== -1) {
              analysisText = analysisText.substring(doubleNewline).trim();
            }
          }
        }

        analysisText = analysisText.replace(/^#\s*\w+\s*:?/im, '').trim();

        // Keep only the first ~3 sentences
        const sentences = analysisText.match(/[^.!?]+[.!?]+/g) || [analysisText];
        if (sentences.length > 3) {
          analysisText = sentences.slice(0, 3).join(' ');
        }

        const stainLower = stainName.toLowerCase();
        const stainTypeLower = stainTypeField.toLowerCase();

        const isNoStain =
          stainLower.includes('no stain') ||
          stainLower.includes('no visible') ||
          stainTypeLower.includes('no stain') ||
          stainTypeLower === 'n/a' ||
          stainTypeLower.includes('error');

        const category = stainTypeField === 'Unknown' ? undefined : stainTypeField;
        const treatments: string[] = [];

        if (treatmentField) {
          treatments.push(treatmentField);
        } else if (category) {
          treatments.push(getAlternativeTreatment(category));
        } else {
          treatments.push('General purpose stain remover');
        }

        finalResult = {
          detected: !isNoStain,
          stainType: stainName,
          category,
          description: analysisText || stainName,
          treatments
        };

        // Cache and return
        analysisCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
        console.log('[Cache] Cached result, total size:', analysisCache.size);
        return finalResult;
      }

      // Case 2: Back-end already returned our shape (or close to it)
      if (typeof rawResult.detected === 'boolean') {
        finalResult = {
          detected: rawResult.detected,
          stainType: rawResult.stainType,
          category: rawResult.category,
          description: rawResult.description,
          treatments: rawResult.treatments
        };

        // Fill treatments if missing but we have a category
        if (finalResult.detected) {
          if ((!finalResult.treatments || finalResult.treatments.length === 0) && finalResult.category) {
            finalResult.treatments = [getAlternativeTreatment(finalResult.category)];
          }
          if (!finalResult.treatments || finalResult.treatments.length === 0) {
            finalResult.treatments = ['General purpose stain remover'];
          }
        }

        analysisCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
        console.log('[Cache] Cached result, total size:', analysisCache.size);
        return finalResult;
      }

      // Case 3: Fallback – we got some text but not structured fields
      const rawText =
        rawResult.completion ||
        rawResult.text ||
        rawResult.message ||
        JSON.stringify(rawResult);

      const hasStainKeywords = /stain|spot|mark|discolor|dirt|blood|wine|coffee|makeup|food/i.test(
        rawText
      );

      finalResult = {
        detected: hasStainKeywords,
        description: hasStainKeywords
          ? "A potential stain was detected, but the analysis was incomplete. Please try again."
          : "Unable to analyze the image clearly. Please ensure the stain is well-lit and centered in the frame.",
        treatments: hasStainKeywords
          ? ["Try taking a clearer photo", "Ensure good lighting"]
          : undefined
      };

      analysisCache.set(cacheKey, { result: finalResult, timestamp: Date.now() });
      for (const [key, value] of analysisCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_DURATION) {
          analysisCache.delete(key);
        }
      }
      return finalResult;
    } catch (parseError) {
      console.error("Failed to interpret AI response:", parseError);
      console.error("Raw response:", data.completion || data.choices?.[0]?.message?.content || data);
      
      const rawText = data.completion || "";
      const hasStainKeywords = /stain|spot|mark|discolor|dirt|blood|wine|coffee|makeup|food/i.test(rawText);
      
      const fallbackResult: StainAnalysisResult = {
        detected: hasStainKeywords,
        description: hasStainKeywords 
          ? "A potential stain was detected, but the analysis was incomplete. Please try again."
          : "Unable to analyze the image clearly. Please ensure the stain is well-lit and centered in the frame.",
        treatments: hasStainKeywords ? ["Try taking a clearer photo", "Ensure good lighting"] : undefined
      };

      analysisCache.set(cacheKey, { result: fallbackResult, timestamp: Date.now() });
      console.log('[Cache] Cached fallback result, total size:', analysisCache.size);
      return fallbackResult;
    }
  } catch (error) {
    console.error("Vision AI error:", error);
    throw error;
  }
}