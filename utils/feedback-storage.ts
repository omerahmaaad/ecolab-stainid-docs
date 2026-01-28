import * as MailComposer from 'expo-mail-composer';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeedbackEntry {
  id?: string;
  timestamp: number;
  imageWithFlash: string;
  imageWithoutFlash: string;
  predictedStainType: string;
  predictedCategory: string;
  userFeedback: 'correct' | 'incorrect';
  correctedStainType?: string;
  correctedCategory?: string;
  modelUsed: string;
  confidence?: number;
}

export interface FeedbackStats {
  totalFeedback: number;
  correctPredictions: number;
  incorrectPredictions: number;
  accuracyRate: number;
  stainTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }>;
  modelPerformance: Record<string, { correct: number; total: number; accuracy: number }>;
}



export async function saveFeedback(feedback: FeedbackEntry, username: string = 'unknown'): Promise<void> {
  try {
    console.log('[saveFeedback] Saving feedback locally');
    
    const existingData = await AsyncStorage.getItem('local_feedback');
    const localFeedback: FeedbackEntry[] = existingData ? JSON.parse(existingData) : [];
    
    const feedbackWithId = {
      ...feedback,
      id: feedback.id || `fb_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
    
    localFeedback.push(feedbackWithId);
    await AsyncStorage.setItem('local_feedback', JSON.stringify(localFeedback));
    console.log('[saveFeedback] Feedback saved locally successfully');
  } catch (error: any) {
    console.error('[saveFeedback] Failed to save feedback locally:', error?.message || error);
    throw error;
  }
}

export async function getFeedbackData(): Promise<FeedbackEntry[]> {
  try {
    console.log('[getFeedbackData] Fetching from local storage...');
    const data = await AsyncStorage.getItem('local_feedback');
    const feedback: FeedbackEntry[] = data ? JSON.parse(data) : [];
    console.log('[getFeedbackData] Retrieved', feedback.length, 'entries from local storage');
    return feedback.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('[getFeedbackData] Failed to load local data:', error);
    return [];
  }
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    console.log('[getFeedbackStats] Calculating stats from local storage...');
    const feedbackData = await getFeedbackData();
    
    const totalFeedback = feedbackData.length;
    const correctPredictions = feedbackData.filter(f => f.userFeedback === 'correct').length;
    const incorrectPredictions = feedbackData.filter(f => f.userFeedback === 'incorrect').length;
    const accuracyRate = totalFeedback > 0 ? (correctPredictions / totalFeedback) * 100 : 0;
    
    const stainTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }> = {};
    const modelPerformance: Record<string, { correct: number; total: number; accuracy: number }> = {};
    
    feedbackData.forEach(entry => {
      const stainType = entry.predictedStainType;
      const model = entry.modelUsed;
      const isCorrect = entry.userFeedback === 'correct';
      
      if (!stainTypeAccuracy[stainType]) {
        stainTypeAccuracy[stainType] = { correct: 0, total: 0, accuracy: 0 };
      }
      stainTypeAccuracy[stainType].total++;
      if (isCorrect) stainTypeAccuracy[stainType].correct++;
      
      if (!modelPerformance[model]) {
        modelPerformance[model] = { correct: 0, total: 0, accuracy: 0 };
      }
      modelPerformance[model].total++;
      if (isCorrect) modelPerformance[model].correct++;
    });
    
    Object.keys(stainTypeAccuracy).forEach(key => {
      const data = stainTypeAccuracy[key];
      data.accuracy = (data.correct / data.total) * 100;
    });
    
    Object.keys(modelPerformance).forEach(key => {
      const data = modelPerformance[key];
      data.accuracy = (data.correct / data.total) * 100;
    });
    
    return {
      totalFeedback,
      correctPredictions,
      incorrectPredictions,
      accuracyRate,
      stainTypeAccuracy,
      modelPerformance,
    };
  } catch (error) {
    console.error('[getFeedbackStats] Failed to calculate stats:', error);
    return {
      totalFeedback: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      accuracyRate: 0,
      stainTypeAccuracy: {},
      modelPerformance: {},
    };
  }
}

export async function clearFeedbackData(): Promise<void> {
  try {
    await AsyncStorage.removeItem('local_feedback');
    console.log('Feedback data cleared from local storage');
  } catch (error) {
    console.error('[clearFeedbackData] Failed to clear local data:', error);
  }
}

export async function resetFeedbackStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem('local_feedback');
    console.log('Feedback statistics reset to 0');
  } catch (error) {
    console.error('[resetFeedbackStats] Failed to reset stats:', error);
  }
}

export async function getRecentFeedback(limit: number = 10): Promise<FeedbackEntry[]> {
  try {
    const data = await getFeedbackData();
    return data.slice(0, limit);
  } catch (error) {
    console.error('[getRecentFeedback] Failed to get recent feedback:', error);
    return [];
  }
}

export async function getFeedbackForStainType(stainType: string): Promise<FeedbackEntry[]> {
  try {
    const data = await getFeedbackData();
    return data.filter(entry => entry.predictedStainType === stainType);
  } catch (error) {
    console.error('[getFeedbackForStainType] Failed to get feedback for stain type:', error);
    return [];
  }
}

export async function exportStainPerformanceToEmail(stainType: string, stainData: { accuracy: number; correct: number; total: number }, feedbackEntries: FeedbackEntry[]): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[exportStainPerformanceToEmail] Exporting stain performance...');
    
    if (feedbackEntries.length === 0) {
      return { success: false, message: 'No feedback data for this stain type.' };
    }

    const reportDate = new Date().toISOString().split('T')[0];
    const subject = `StainID - Poor Performance Alert: ${stainType} - ${reportDate}`;
    
    let body = `STAINID POOR PERFORMANCE ALERT\n`;
    body += `Generated: ${new Date().toLocaleString()}\n\n`;
    body += `=== STAIN TYPE ===\n`;
    body += `${stainType.replace(/_/g, ' ').toUpperCase()}\n\n`;
    body += `=== PERFORMANCE METRICS ===\n`;
    body += `Accuracy: ${stainData.accuracy.toFixed(1)}%\n`;
    body += `Correct Predictions: ${stainData.correct}\n`;
    body += `Incorrect Predictions: ${stainData.total - stainData.correct}\n`;
    body += `Total Scans: ${stainData.total}\n\n`;
    
    body += `=== MISCLASSIFICATIONS ===\n\n`;
    
    const incorrectEntries = feedbackEntries.filter(e => e.userFeedback === 'incorrect');
    incorrectEntries.forEach((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleString();
      body += `--- Misclassification ${index + 1} ---\n`;
      body += `Date: ${date}\n`;
      body += `Predicted: ${entry.predictedStainType} (${entry.predictedCategory})\n`;
      body += `Corrected To: ${entry.correctedStainType || 'Not specified'} (${entry.correctedCategory || 'N/A'})\n`;
      body += `Model Used: ${entry.modelUsed}\n`;
      body += `\n`;
    });
    
    body += `\n=== RECOMMENDATION ===\n`;
    body += `This stain type requires model improvement. Please review the misclassifications above and update the training data accordingly.\n\n`;
    body += `Images and detailed data are stored locally on device.\n`;
    body += `\n=== END OF REPORT ===`;
    
    const recipientEmail = 'omer.ahmad@ecolab.com';
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (isAvailable) {
      console.log('[exportStainPerformanceToEmail] Opening mail composer...');
      const result = await MailComposer.composeAsync({
        recipients: [recipientEmail],
        subject: subject,
        body: body,
        isHtml: false,
      });
      
      if (result.status === MailComposer.MailComposerStatus.SENT) {
        return { success: true, message: 'Performance report sent successfully!' };
      } else if (result.status === MailComposer.MailComposerStatus.SAVED) {
        return { success: true, message: 'Performance report saved as draft.' };
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        return { success: false, message: 'Email was cancelled.' };
      }
      return { success: true, message: 'Email composer opened.' };
    } else {
      console.log('[exportStainPerformanceToEmail] Mail composer not available, using mailto...');
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        return { success: true, message: 'Email client opened.' };
      } else {
        return { success: false, message: 'No email client available on this device.' };
      }
    }
  } catch (error: any) {
    console.error('[exportStainPerformanceToEmail] Error:', error?.message || error);
    return { success: false, message: `Failed to export: ${error?.message || 'Unknown error'}` };
  }
}

export async function exportFeedbackToEmail(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[exportFeedbackToEmail] Fetching feedback data...');
    const feedbackData = await getFeedbackData();
    const stats = await getFeedbackStats();
    
    if (feedbackData.length === 0) {
      return { success: false, message: 'No feedback data to export.' };
    }

    const reportDate = new Date().toISOString().split('T')[0];
    const subject = `StainID Feedback Report - ${reportDate}`;
    
    // Build the email body with summary
    let body = `STAINID MODEL FEEDBACK REPORT\n`;
    body += `Generated: ${new Date().toLocaleString()}\n`;
    body += `Total Entries: ${feedbackData.length}\n\n`;
    
    body += `=== SUMMARY ===\n`;
    body += `Overall Accuracy: ${stats.accuracyRate.toFixed(1)}%\n`;
    body += `Correct Predictions: ${stats.correctPredictions}\n`;
    body += `Incorrect Predictions: ${stats.incorrectPredictions}\n\n`;
    
    // Model performance
    if (Object.keys(stats.modelPerformance).length > 0) {
      body += `=== MODEL PERFORMANCE ===\n`;
      Object.entries(stats.modelPerformance).forEach(([model, data]) => {
        body += `${model}: ${data.accuracy.toFixed(1)}% (${data.correct}/${data.total})\n`;
      });
      body += `\n`;
    }
    
    // Stain type accuracy
    if (Object.keys(stats.stainTypeAccuracy).length > 0) {
      body += `=== STAIN TYPE ACCURACY ===\n`;
      Object.entries(stats.stainTypeAccuracy).forEach(([stainType, data]) => {
        body += `${stainType}: ${data.accuracy.toFixed(1)}% (${data.correct}/${data.total})\n`;
      });
      body += `\n`;
    }
    
    // Detailed entries (without images for email size)
    body += `=== DETAILED FEEDBACK ENTRIES ===\n\n`;
    
    feedbackData.forEach((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleString();
      body += `--- Entry ${index + 1} ---\n`;
      body += `Date: ${date}\n`;
      body += `Model Used: ${entry.modelUsed}\n`;
      body += `Predicted Stain: ${entry.predictedStainType}\n`;
      body += `Predicted Category: ${entry.predictedCategory}\n`;
      body += `Classification: ${entry.userFeedback.toUpperCase()}\n`;
      if (entry.confidence) {
        body += `Confidence: ${(entry.confidence * 100).toFixed(1)}%\n`;
      }
      if (entry.userFeedback === 'incorrect') {
        body += `Correct Stain: ${entry.correctedStainType || 'Not specified'}\n`;
        body += `Correct Category: ${entry.correctedCategory || 'Not specified'}\n`;
      }
      body += `\n`;
    });
    
    body += `\n=== END OF REPORT ===\n`;
    body += `\nNote: Images are stored in the database and can be retrieved separately if needed.`;
    
    const recipientEmail = 'omer.ahmad@ecolab.com';
    
    // Check if mail composer is available
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (isAvailable) {
      console.log('[exportFeedbackToEmail] Opening mail composer...');
      const result = await MailComposer.composeAsync({
        recipients: [recipientEmail],
        subject: subject,
        body: body,
        isHtml: false,
      });
      
      console.log('[exportFeedbackToEmail] Mail composer result:', result.status);
      
      if (result.status === MailComposer.MailComposerStatus.SENT) {
        return { success: true, message: 'Email sent successfully!' };
      } else if (result.status === MailComposer.MailComposerStatus.SAVED) {
        return { success: true, message: 'Email saved as draft.' };
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        return { success: false, message: 'Email was cancelled.' };
      }
      return { success: true, message: 'Email composer opened.' };
    } else {
      // Fallback to mailto link
      console.log('[exportFeedbackToEmail] Mail composer not available, using mailto...');
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        return { success: true, message: 'Email client opened.' };
      } else {
        return { success: false, message: 'No email client available on this device.' };
      }
    }
  } catch (error: any) {
    console.error('[exportFeedbackToEmail] Error:', error?.message || error);
    return { success: false, message: `Failed to export: ${error?.message || 'Unknown error'}` };
  }
}
