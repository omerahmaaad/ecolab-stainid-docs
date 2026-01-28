import { FeedbackEntry } from './feedback-storage';

interface StainAnalysis {
  stainType?: string;
  category?: string;
}

interface StainImages {
  withFlash: string;
  withoutFlash: string;
}

/**
 * Generate a unique feedback ID
 */
function generateFeedbackId(): string {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a feedback entry for correct prediction
 */
export function createCorrectFeedbackEntry(
  analysis: StainAnalysis,
  images: StainImages,
  modelUsed: string
): FeedbackEntry {
  return {
    id: generateFeedbackId(),
    timestamp: Date.now(),
    imageWithFlash: images.withFlash,
    imageWithoutFlash: images.withoutFlash,
    predictedStainType: analysis.stainType || 'unknown',
    predictedCategory: analysis.category || 'unknown',
    userFeedback: 'correct',
    modelUsed,
  };
}

/**
 * Create a feedback entry for incorrect prediction with correction
 */
export function createIncorrectFeedbackEntry(
  analysis: StainAnalysis,
  images: StainImages,
  modelUsed: string,
  correctedStainType: string,
  correctedCategory: string
): FeedbackEntry {
  return {
    id: generateFeedbackId(),
    timestamp: Date.now(),
    imageWithFlash: images.withFlash,
    imageWithoutFlash: images.withoutFlash,
    predictedStainType: analysis.stainType || 'unknown',
    predictedCategory: analysis.category || 'unknown',
    userFeedback: 'incorrect',
    correctedStainType,
    correctedCategory,
    modelUsed,
  };
}
