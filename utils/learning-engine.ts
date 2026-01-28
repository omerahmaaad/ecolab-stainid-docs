import { getFeedbackData, getFeedbackStats, FeedbackEntry } from './feedback-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LearningInsights {
  confidenceAdjustments: Record<string, number>;
  problematicStainTypes: string[];
  modelRecommendations: string[];
  patternCorrections: {
    from: string;
    to: string;
    frequency: number;
  }[];
}

export async function generateLearningInsights(): Promise<LearningInsights> {
  const feedbackData = await getFeedbackData();
  const stats = await getFeedbackStats();

  const confidenceAdjustments: Record<string, number> = {};
  const patternCorrections: Map<string, Map<string, number>> = new Map();
  
  feedbackData.forEach(entry => {
    const stainType = entry.predictedStainType;
    
    if (!confidenceAdjustments[stainType]) {
      confidenceAdjustments[stainType] = 0;
    }
    
    if (entry.userFeedback === 'correct') {
      confidenceAdjustments[stainType] += 0.05;
    } else {
      confidenceAdjustments[stainType] -= 0.1;
      
      if (entry.correctedStainType) {
        if (!patternCorrections.has(stainType)) {
          patternCorrections.set(stainType, new Map());
        }
        const corrections = patternCorrections.get(stainType)!;
        const count = corrections.get(entry.correctedStainType) || 0;
        corrections.set(entry.correctedStainType, count + 1);
      }
    }
  });

  const problematicStainTypes = Object.entries(stats.stainTypeAccuracy)
    .filter(([_, data]) => data.accuracy < 70 && data.total >= 3)
    .map(([type]) => type)
    .sort((a, b) => stats.stainTypeAccuracy[a].accuracy - stats.stainTypeAccuracy[b].accuracy);

  const modelRecommendations = Object.entries(stats.modelPerformance)
    .sort((a, b) => b[1].accuracy - a[1].accuracy)
    .slice(0, 3)
    .map(([model, data]) => `${model} (${data.accuracy.toFixed(1)}% accuracy)`);

  const patternCorrectionsArray = Array.from(patternCorrections.entries())
    .flatMap(([from, corrections]) =>
      Array.from(corrections.entries()).map(([to, frequency]) => ({
        from,
        to,
        frequency,
      }))
    )
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return {
    confidenceAdjustments,
    problematicStainTypes,
    modelRecommendations,
    patternCorrections: patternCorrectionsArray,
  };
}

export function calculateStainTypeProbability(
  stainType: string,
  baseConfidence: number,
  insights: LearningInsights
): number {
  const adjustment = insights.confidenceAdjustments[stainType] || 0;
  const adjustedConfidence = Math.max(0, Math.min(1, baseConfidence + adjustment));
  return adjustedConfidence;
}

export function suggestAlternativeStainType(
  predictedType: string,
  insights: LearningInsights
): string | null {
  const correction = insights.patternCorrections.find(
    c => c.from === predictedType && c.frequency >= 3
  );
  return correction ? correction.to : null;
}

export async function getReinforcementPrompt(): Promise<string> {
  const insights = await generateLearningInsights();
  
  if (insights.patternCorrections.length === 0) {
    return '';
  }

  const corrections = insights.patternCorrections
    .slice(0, 5)
    .map(c => `- Users often correct "${c.from}" to "${c.to}" (${c.frequency} times)`)
    .join('\n');

  const problematic = insights.problematicStainTypes.length > 0
    ? `\n\nBe extra careful with: ${insights.problematicStainTypes.slice(0, 3).join(', ')}`
    : '';

  return `\n\nLEARNING FROM USER FEEDBACK:\n${corrections}${problematic}\n\nConsider these patterns when making your prediction.`;
}

interface StainWeights {
  [stainType: string]: {
    baseWeight: number;
    adjustments: number;
    lastUpdated: number;
  };
}

const WEIGHTS_STORAGE_KEY = 'stain_type_weights';
const LEARNING_RATE = 0.05;

export async function getStainWeights(): Promise<StainWeights> {
  try {
    const weightsData = await AsyncStorage.getItem(WEIGHTS_STORAGE_KEY);
    if (!weightsData) {
      return {};
    }
    return JSON.parse(weightsData);
  } catch (error) {
    console.error('Failed to load stain weights:', error);
    return {};
  }
}

export async function saveStainWeights(weights: StainWeights): Promise<void> {
  try {
    await AsyncStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
    console.log('Stain weights saved successfully');
  } catch (error) {
    console.error('Failed to save stain weights:', error);
  }
}

export async function updateWeightsFromFeedback(feedback: FeedbackEntry): Promise<void> {
  try {
    const weights = await getStainWeights();
    
    if (feedback.userFeedback === 'correct') {
      if (!weights[feedback.predictedStainType]) {
        weights[feedback.predictedStainType] = {
          baseWeight: 1.0,
          adjustments: 0,
          lastUpdated: Date.now(),
        };
      }
      
      weights[feedback.predictedStainType].adjustments += LEARNING_RATE;
      weights[feedback.predictedStainType].lastUpdated = Date.now();
      
      console.log(`Increased weight for ${feedback.predictedStainType} by ${LEARNING_RATE}`);
    } else if (feedback.userFeedback === 'incorrect' && feedback.correctedStainType) {
      if (!weights[feedback.predictedStainType]) {
        weights[feedback.predictedStainType] = {
          baseWeight: 1.0,
          adjustments: 0,
          lastUpdated: Date.now(),
        };
      }
      weights[feedback.predictedStainType].adjustments -= LEARNING_RATE * 2;
      weights[feedback.predictedStainType].lastUpdated = Date.now();
      
      if (!weights[feedback.correctedStainType]) {
        weights[feedback.correctedStainType] = {
          baseWeight: 1.0,
          adjustments: 0,
          lastUpdated: Date.now(),
        };
      }
      weights[feedback.correctedStainType].adjustments += LEARNING_RATE * 1.5;
      weights[feedback.correctedStainType].lastUpdated = Date.now();
      
      console.log(`Decreased weight for ${feedback.predictedStainType} by ${LEARNING_RATE * 2}`);
      console.log(`Increased weight for ${feedback.correctedStainType} by ${LEARNING_RATE * 1.5}`);
    }
    
    await saveStainWeights(weights);
    console.log('Weights updated successfully');
  } catch (error) {
    console.error('Failed to update weights from feedback:', error);
  }
}

export async function getAdjustedConfidence(stainType: string, baseConfidence: number): Promise<number> {
  try {
    const weights = await getStainWeights();
    const weight = weights[stainType];
    
    if (!weight) {
      return baseConfidence;
    }
    
    const totalWeight = weight.baseWeight + weight.adjustments;
    const adjustedConfidence = Math.max(0.1, Math.min(1.0, baseConfidence * totalWeight));
    
    console.log(`Adjusted confidence for ${stainType}: ${baseConfidence} -> ${adjustedConfidence}`);
    return adjustedConfidence;
  } catch (error) {
    console.error('Failed to get adjusted confidence:', error);
    return baseConfidence;
  }
}

export async function shouldSuggestModelSwitch(): Promise<{ suggest: boolean; recommendedModel?: string }> {
  const stats = await getFeedbackStats();
  const currentModelPerformance = Object.entries(stats.modelPerformance);
  
  if (currentModelPerformance.length < 2) {
    return { suggest: false };
  }

  const sortedModels = currentModelPerformance
    .filter(([_, data]) => data.total >= 5)
    .sort((a, b) => b[1].accuracy - a[1].accuracy);

  if (sortedModels.length < 2) {
    return { suggest: false };
  }

  const [bestModel, secondModel] = sortedModels;
  const accuracyDiff = bestModel[1].accuracy - secondModel[1].accuracy;

  if (accuracyDiff > 15) {
    return {
      suggest: true,
      recommendedModel: bestModel[0],
    };
  }

  return { suggest: false };
}
