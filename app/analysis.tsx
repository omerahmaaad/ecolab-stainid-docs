import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Dimensions,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import * as MailComposer from 'expo-mail-composer';
import { router } from "expo-router";
import { X, CheckCircle, AlertCircle, RefreshCw, Sparkles, ThumbsUp, ThumbsDown, Search, Mail } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStain } from "@/hooks/stain-context";
import { analyzeStain, getStainTypesList } from "@/utils/vision-ai";
import { saveFeedback } from "@/utils/feedback-storage";
import { updateWeightsFromFeedback } from "@/utils/learning-engine";
import { useLanguage } from "@/hooks/language-context";
import { useAuth } from "@/hooks/auth-context";
import { base64ToDataUri, getStainDisplayName, getCategoryDisplayName, isValidBase64Image } from "@/utils/image-utils";
import { getStainColor, findProductImage } from "@/utils/stain-data";
import { createCorrectFeedbackEntry, createIncorrectFeedbackEntry } from "@/utils/feedback-helpers";



interface StainAnalysis {
  detected: boolean;
  stainType?: string;
  category?: string;
  description?: string;
  treatments?: string[];
}

// Extracted component for treatment display
function TreatmentContent({
  treatment,
  onImagePress
}: {
  treatment: string;
  onImagePress: (url: string) => void;
}) {
  const productImage = findProductImage(treatment);

  return (
    <View style={styles.treatmentContent}>
      <Text style={styles.treatmentText}>{treatment}</Text>
      {productImage && (
        <Pressable onPress={() => onImagePress(productImage)}>
          <Image
            source={{ uri: productImage }}
            style={styles.productImage}
            resizeMode="contain"
          />
        </Pressable>
      )}
    </View>
  );
}

export default function AnalysisScreen() {
  const { images, clearImages, selectedModel, aiModel, apiLanguage } = useStain();
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<StainAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<string>("Starting analysis...");
  const [streamingText, setStreamingText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(false);
  const [showStainTypeSelector, setShowStainTypeSelector] = useState<boolean>(false);
  const [selectedCorrectType, setSelectedCorrectType] = useState<string | null>(null);
  const [availableStainTypes, setAvailableStainTypes] = useState<{name: string; category: string}[]>([]);
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [stainDescription, setStainDescription] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false)

  const performAnalysis = useCallback(async (retryCount: number = 0) => {
    setIsAnalyzing(true);
    setError(null);
    setStreamingText("");
    setIsStreaming(true);
    setAnalysisProgress("Preparing images for analysis...");

    // Start streaming analysis thoughts
    const streamingMessages = [
      t('streamingMessages.0'),
      t('streamingMessages.1'),
      t('streamingMessages.2'),
      t('streamingMessages.3'),
      t('streamingMessages.4'),
      t('streamingMessages.5'),
      t('streamingMessages.6')
    ];

    let messageIndex = 0;
    const streamInterval = setInterval(() => {
      if (messageIndex < streamingMessages.length) {
        setStreamingText(streamingMessages[messageIndex]);
        messageIndex++;
      }
    }, 800);

    try {
      console.log('[performAnalysis] Starting with model:', selectedModel);
      
      setAnalysisProgress(`Analyzing with Ecolab Digital AI...`);
      
      setAnalysisProgress(`Processing with Ecolab Digital AI...`);
      const result = await analyzeStain(
        images!.withFlash, 
        images!.withoutFlash, 
        selectedModel,
        locale,
        aiModel,
        apiLanguage
      );
      
      clearInterval(streamInterval);
      setIsStreaming(false);
      setStreamingText(t('analysis.complete'));
      setAnalysisProgress(t('analysis.complete'));
      setAnalysis(result);
    } catch (err) {
      clearInterval(streamInterval);
      setIsStreaming(false);
      console.error("Analysis error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image. Please try again.";
      
      setError(errorMessage);
      setAnalysisProgress(t('analysis.failed'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [images, selectedModel, t, locale, aiModel, apiLanguage]);

  useEffect(() => {
    if (images?.withFlash && images?.withoutFlash && images.withFlash.length > 0 && images.withoutFlash.length > 0) {
      setAnalysisProgress("Images captured! Starting analysis...");
      const timeoutId = setTimeout(() => {
        performAnalysis();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      console.log('[Analysis] No images available, going back');
      router.back();
    }
  }, [images, selectedModel, performAnalysis]);

  useEffect(() => {
    return () => {
      console.log('[Analysis] Component unmounted, cleaning up');
    };
  }, []);

  const handleRetry = () => router.push("/camera");
  const handleClose = () => { clearImages(); router.replace("/"); };

  useEffect(() => {
    const loadStainTypes = async () => {
      const types = await getStainTypesList();
      const treatedStains = types.filter(type => 
        type.category !== 'Unknown' && 
        type.name.toLowerCase() !== 'other'
      );
      setAvailableStainTypes(treatedStains);
    };
    loadStainTypes();
  }, []);

  const handleFeedbackCorrect = async () => {
    if (!analysis || !images) return;

    try {
      console.log('[Feedback] Starting to save positive feedback...');
      const feedbackEntry = createCorrectFeedbackEntry(analysis, images, selectedModel);
      const username = user?.username || 'unknown';

      console.log('[Feedback] Saving positive feedback with username:', username);
      await saveFeedback(feedbackEntry, username);
      console.log('[Feedback] Updating learning weights...');
      await updateWeightsFromFeedback(feedbackEntry);
      console.log('[Feedback] Positive feedback saved successfully:', feedbackEntry.id);

      setFeedbackGiven(true);
      Alert.alert('Thank you!', 'Your feedback has been recorded successfully.');
    } catch (error: any) {
      console.error('[Feedback] Failed to save feedback:', error);
      Alert.alert('Error', `Failed to save feedback: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleFeedbackIncorrect = () => {
    if (!user?.role) {
      Alert.alert(
        'Login Required',
        'Please log in to record incorrect feedback and help improve the model.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowStainTypeSelector(true);
  };

  const handleCorrectTypeSelected = async (correctType: string, correctCategory: string) => {
    if (!analysis || !images) return;

    try {
      console.log('[Feedback] Starting to save corrective feedback...');
      const feedbackEntry = createIncorrectFeedbackEntry(
        analysis,
        images,
        selectedModel,
        correctType,
        correctCategory
      );
      const username = user?.username || 'unknown';

      console.log('[Feedback] Saving corrective feedback with username:', username);
      await saveFeedback(feedbackEntry, username);
      console.log('[Feedback] Updating learning weights...');
      await updateWeightsFromFeedback(feedbackEntry);
      console.log('[Feedback] Corrective feedback saved successfully:', feedbackEntry.id);

      setSelectedCorrectType(correctType);
      setShowStainTypeSelector(false);
      setFeedbackGiven(true);
      Alert.alert('Thank you!', 'Your feedback has been recorded successfully.');
    } catch (error: any) {
      console.error('[Feedback] Failed to save corrective feedback:', error);
      Alert.alert('Error', `Failed to save feedback: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleEmailDeveloper = () => {
    setShowStainTypeSelector(false);
    setShowEmailForm(true);
  };

  const handleSendDeveloperEmail = async () => {
    if (!stainDescription.trim()) {
      Alert.alert('Required', 'Please describe the stain type you observed.');
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      const emailBody = `STAIN TYPE NOT IN DATABASE\n\n` +
        `User Feedback:\n` +
        `Predicted Stain: ${analysis?.stainType || 'unknown'}\n` +
        `Predicted Category: ${analysis?.category || 'unknown'}\n` +
        `Model Used: ${selectedModel}\n\n` +
        `User's Observed Stain Type:\n${stainDescription}\n\n` +
        `Username: ${user?.username || 'unknown'}\n` +
        `Date: ${new Date().toLocaleString()}\n\n` +
        `Please add this stain type to the database for future classifications.`;
      
      const recipientEmail = 'omer.ahmad@ecolab.com';
      
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [recipientEmail],
          subject: 'StainID - New Stain Type Request',
          body: emailBody,
          isHtml: false,
        });
        setShowEmailForm(false);
        setStainDescription('');
        setFeedbackGiven(true);
        Alert.alert('Thank you!', 'Email has been prepared. Please send it to help us improve the database.');
      } else {
        const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent('StainID - New Stain Type Request')}&body=${encodeURIComponent(emailBody)}`;
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
          setShowEmailForm(false);
          setStainDescription('');
          setFeedbackGiven(true);
          Alert.alert('Thank you!', 'Email client opened.');
        } else {
          Alert.alert('Error', 'No email client available on this device.');
        }
      }
    } catch (error: any) {
      console.error('[Email] Failed to compose email:', error);
      Alert.alert('Error', `Failed to open email: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066CC", "#004499"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ecolab Results</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isAnalyzing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>{analysisProgress}</Text>
                <View style={styles.progressIndicator}>
                  <View style={[styles.progressBar, { 
                    width: analysisProgress.includes("complete") ? "100%" : 
                           analysisProgress.includes("Processing") || analysisProgress.includes("Running") ? "70%" : 
                           analysisProgress.includes("Preparing") ? "30%" : "10%" 
                  }]} />
                </View>
                <Text style={styles.loadingSubtext}>
                  {t('home.using')} Ecolab Digital AI
                </Text>
                {isStreaming && streamingText && (
                  <View style={styles.streamingContainer}>
                    <Text style={styles.streamingText}>{streamingText}</Text>
                  </View>
                )}

              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <AlertCircle color="#FF6B6B" size={48} />
                <Text style={styles.errorText}>{error}</Text>
                {error.includes('Server error') || error.includes('Service not found') || error.includes('temporarily unavailable') ? (
                  <View style={styles.errorHintContainer}>
                    <Text style={styles.errorHint}>
                      {t('analysis.modelIssues')}
                    </Text>
                    <Text style={styles.errorHint}>
                      {t('analysis.modelIssuesHint')}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.retryContainer}>
                  <TouchableOpacity style={styles.retryButton} onPress={() => performAnalysis(0)}>
                    <RefreshCw color="#fff" size={20} />
                    <Text style={styles.retryButtonText}>{t('analysis.tryAgain')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : analysis ? (
              <>
                {isValidBase64Image(images?.withoutFlash) && isValidBase64Image(images?.withFlash) && (
                  <View style={styles.imageContainer}>
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: base64ToDataUri(images!.withoutFlash) }}
                        style={styles.previewImage}
                        onError={() => console.log('Image load error (no flash)')}
                        onLoad={() => console.log('Image loaded successfully (no flash)')}
                      />
                      <Text style={styles.imageLabel}>{t('analysis.withoutFlash')}</Text>
                    </View>
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: base64ToDataUri(images!.withFlash) }}
                        style={styles.previewImage}
                        onError={() => console.log('Image load error (with flash)')}
                        onLoad={() => console.log('Image loaded successfully (with flash)')}
                      />
                      <Text style={styles.imageLabel}>{t('analysis.withFlash')}</Text>
                    </View>
                  </View>
                )}

                {analysis.detected ? (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <CheckCircle color="#4CAF50" size={28} />
                      <Text style={styles.resultTitle}>{t('analysis.stainIdentified')}</Text>
                    </View>

                    <View 
                      style={[
                        styles.stainTypeCard,
                        { backgroundColor: getStainColor(analysis.stainType) }
                      ]}
                    >
                      <Sparkles color="#fff" size={20} />
                      <Text style={styles.stainType}>
                        {getStainDisplayName(analysis.stainType, t)}
                      </Text>
                      {analysis.category && (
                        <Text style={styles.confidence}>
                          {getCategoryDisplayName(analysis.category, t)}
                        </Text>
                      )}
                    </View>

                    {analysis.treatments && analysis.treatments.length > 0 && (
                      <View style={styles.treatmentsCard}>
                        <Text style={styles.treatmentsTitle}>{t('analysis.ecolabTreatment')}</Text>
                        <View style={styles.treatmentItem}>
                          <TreatmentContent
                            treatment={analysis.treatments[0]}
                            onImagePress={setSelectedProductImage}
                          />
                        </View>
                      </View>
                    )}

                    {analysis.description && (
                      <View style={styles.descriptionCard}>
                        <Text style={styles.descriptionCardTitle}>{t('analysis.stainAnalysis')}</Text>
                        <Text style={styles.description}>{analysis.description}</Text>
                      </View>
                    )}

                    {!feedbackGiven && (
                      <View style={styles.feedbackCard}>
                        <Text style={styles.feedbackTitle}>{t('analysis.wasCorrect')}</Text>
                        <View style={styles.feedbackButtons}>
                          <TouchableOpacity 
                            style={styles.feedbackButton}
                            onPress={handleFeedbackCorrect}
                          >
                            <ThumbsUp color="#4CAF50" size={24} />
                            <Text style={styles.feedbackButtonText}>{t('analysis.yesCorrect')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[
                              styles.feedbackButton, 
                              styles.feedbackButtonIncorrect,
                              !user?.role && styles.feedbackButtonDisabled
                            ]}
                            onPress={handleFeedbackIncorrect}
                          >
                            <ThumbsDown color="#FF6B6B" size={24} />
                            <Text style={styles.feedbackButtonText}>{t('analysis.noIncorrect')}</Text>
                          </TouchableOpacity>
                        </View>
                        {!user?.role && (
                          <Text style={styles.adminOnlyHint}>
                            Login required to record incorrect feedback
                          </Text>
                        )}
                      </View>
                    )}

                    {feedbackGiven && (
                      <View style={styles.feedbackThanks}>
                        <CheckCircle color="#4CAF50" size={20} />
                        <Text style={styles.feedbackThanksText}>
                          {t('analysis.thankYou')}{selectedCorrectType ? ` ${t('analysis.correctedTo')} ${selectedCorrectType}` : ''}{` ${t('analysis.feedbackHelps')}`}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.noStainCard}>
                    <AlertCircle color="#FFA500" size={48} />
                    <Text style={styles.noStainTitle}>{t('analysis.noStainDetected')}</Text>
                    <Text style={styles.noStainText}>
                      {analysis.description || t('analysis.noStainMessage')}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.newScanButton}
                  onPress={handleRetry}
                >
                  <RefreshCw color="#fff" size={20} />
                  <Text style={styles.newScanButtonText}>{t('analysis.takeNewPhoto')}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <Modal
        visible={showStainTypeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStainTypeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('analysis.selectCorrectType')}</Text>
              <TouchableOpacity 
                onPress={() => setShowStainTypeSelector(false)}
                style={styles.modalCloseButton}
              >
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <Search color="#999" size={20} />
              <Text style={styles.searchPlaceholder}>{t('analysis.searchPlaceholder')}</Text>
            </View>

            <FlatList
              data={availableStainTypes}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              style={styles.stainTypeList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stainTypeItem}
                  onPress={() => handleCorrectTypeSelected(item.name, item.category)}
                >
                  <View style={styles.stainTypeInfo}>
                    <Text style={styles.stainTypeName}>
                      {getStainDisplayName(item.name, t)}
                    </Text>
                    <Text style={styles.stainTypeCategory}>
                      {getCategoryDisplayName(item.category, t)}
                    </Text>
                  </View>
                  <CheckCircle color="#0066CC" size={20} />
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={styles.emailDeveloperButton}
              onPress={handleEmailDeveloper}
            >
              <Mail color="#0066CC" size={20} />
              <Text style={styles.emailDeveloperButtonText}>My stain type is not listed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedProductImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProductImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable
            style={styles.imageModalCloseArea}
            onPress={() => setSelectedProductImage(null)}
          >
            <View style={styles.imageModalContent}>
              <TouchableOpacity
                style={styles.imageModalCloseButton}
                onPress={() => setSelectedProductImage(null)}
              >
                <X color="#fff" size={28} />
              </TouchableOpacity>
              {selectedProductImage && (
                <Image
                  source={{ uri: selectedProductImage }}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={showEmailForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Describe the Stain Type</Text>
              <TouchableOpacity 
                onPress={() => setShowEmailForm(false)}
                style={styles.modalCloseButton}
              >
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.emailFormContent}>
              <Text style={styles.emailFormDescription}>
                Please describe the stain type you observed. This will help us add it to our database.
              </Text>
              
              <View style={styles.predictionInfo}>
                <Text style={styles.predictionLabel}>AI Predicted:</Text>
                <Text style={styles.predictionValue}>{analysis?.stainType || 'unknown'}</Text>
              </View>
              
              <TextInput
                style={styles.stainDescriptionInput}
                placeholder="Describe the actual stain type (e.g., 'Lipstick', 'Motor Oil', 'Ink')..."
                placeholderTextColor="#999"
                value={stainDescription}
                onChangeText={setStainDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.sendEmailButton, isSendingEmail && styles.sendEmailButtonDisabled]}
                onPress={handleSendDeveloperEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Mail color="#fff" size={20} />
                    <Text style={styles.sendEmailButtonText}>Send to Developer</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  imageWrapper: {
    flex: 1,
    alignItems: "center",
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  stainTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  stainType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  confidence: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  descriptionCard: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  descriptionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  treatmentsCard: {
    backgroundColor: "#F0F4FF",
    padding: 16,
    borderRadius: 12,
  },
  treatmentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
    marginBottom: 16,
  },
  treatmentItem: {
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0066CC",
  },
  treatmentContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  treatmentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    width: "100%",
  },
  noStainCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  noStainTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 12,
  },
  noStainText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  newScanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  newScanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  progressIndicator: {
    width: 200,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginTop: 16,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#FFC107",
    borderRadius: 2,
  },
  streamingContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  streamingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontStyle: "italic",
    textAlign: "center",
  },
  feedbackCard: {
    backgroundColor: "#F0F4FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  feedbackButtonIncorrect: {
    borderColor: "#FF6B6B",
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  feedbackThanks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  feedbackThanksText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  feedbackButtonDisabled: {
    opacity: 0.5,
  },
  adminOnlyHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  errorHintContainer: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  errorHint: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#999",
  },
  stainTypeList: {
    paddingHorizontal: 16,
  },
  stainTypeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  stainTypeInfo: {
    flex: 1,
  },
  stainTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  stainTypeCategory: {
    fontSize: 14,
    color: "#666",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalCloseArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageModalCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  imageModalImage: {
    width: Dimensions.get("window").width - 40,
    height: Dimensions.get("window").height - 200,
  },
  emailDeveloperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    borderStyle: 'dashed',
    gap: 8,
  },
  emailDeveloperButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  emailFormContent: {
    padding: 20,
  },
  emailFormDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  predictionInfo: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  predictionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stainDescriptionInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  sendEmailButtonDisabled: {
    opacity: 0.6,
  },
  sendEmailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});