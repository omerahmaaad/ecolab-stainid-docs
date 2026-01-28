import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { X, TrendingUp, Target, BarChart3, Award, AlertTriangle, Mail } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getFeedbackStats, FeedbackStats, resetFeedbackStats, exportFeedbackToEmail, exportStainPerformanceToEmail, getFeedbackForStainType } from "@/utils/feedback-storage";

export default function StatisticsScreen() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const loadStats = async () => {
    console.log('[Statistics] Loading stats...');
    setIsLoading(true);
    try {
      const data = await getFeedbackStats();
      console.log('[Statistics] Stats loaded:', data);
      setStats(data);
    } catch (error) {
      console.error('[Statistics] Failed to load statistics:', error);
      setStats({
        totalFeedback: 0,
        correctPredictions: 0,
        incorrectPredictions: 0,
        accuracyRate: 0,
        stainTypeAccuracy: {},
        modelPerformance: {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearData = async () => {
    if (password !== "stainid123") {
      Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      return;
    }
    
    try {
      await resetFeedbackStats();
      await loadStats();
      setShowClearConfirm(false);
      setPassword("");
    } catch (error) {
      console.error('Failed to clear data:', error);
      Alert.alert('Error', 'Failed to reset statistics.');
    }
  };

  const handleResetClick = () => {
    setShowClearConfirm(true);
  };

  const handleExportEmail = async () => {
    console.log('[Statistics] Exporting feedback to email...');
    setIsExporting(true);
    try {
      const result = await exportFeedbackToEmail();
      if (result.success) {
        Alert.alert('Export', result.message);
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error: any) {
      console.error('[Statistics] Export error:', error);
      Alert.alert('Error', 'Failed to export feedback data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    setShowClearConfirm(false);
    setPassword("");
  };

  const handleClose = () => {
    router.back();
  };

  const renderAccuracyBar = (accuracy: number) => {
    const color = accuracy >= 80 ? "#4CAF50" : accuracy >= 60 ? "#FFC107" : "#FF6B6B";
    return (
      <View style={styles.accuracyBarContainer}>
        <View style={[styles.accuracyBarFill, { width: `${accuracy}%`, backgroundColor: color }]} />
      </View>
    );
  };

  const handleEmailStainPerformance = async (stainType: string, stainData: { accuracy: number; correct: number; total: number }) => {
    console.log('[Statistics] Emailing stain performance for:', stainType);
    setIsExporting(true);
    try {
      const feedbackEntries = await getFeedbackForStainType(stainType);
      const result = await exportStainPerformanceToEmail(stainType, stainData, feedbackEntries);
      if (result.success) {
        Alert.alert('Export Success', result.message);
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error: any) {
      console.error('[Statistics] Export stain error:', error);
      Alert.alert('Error', 'Failed to export stain performance data.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderStainTypeAccuracy = () => {
    if (!stats || !stats.stainTypeAccuracy || Object.keys(stats.stainTypeAccuracy).length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No stain type data yet</Text>
        </View>
      );
    }

    const sortedTypes = Object.entries(stats.stainTypeAccuracy).sort(
      ([, a], [, b]) => b.total - a.total
    );

    return sortedTypes.map(([stainType, data]) => {
      const isPoorPerformance = data.accuracy < 60 && data.total >= 3;
      
      return (
        <View key={stainType} style={styles.stainTypeRow}>
          <View style={styles.stainTypeHeader}>
            <View style={styles.stainTypeNameContainer}>
              <Text style={styles.stainTypeName}>
                {stainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              {isPoorPerformance && (
                <View style={styles.poorPerformanceBadge}>
                  <AlertTriangle color="#FF6B6B" size={14} />
                  <Text style={styles.poorPerformanceText}>Needs Improvement</Text>
                </View>
              )}
            </View>
            <View style={styles.stainTypeStats}>
              <Text style={styles.stainTypeAccuracy}>
                {data.accuracy.toFixed(1)}%
              </Text>
              <Text style={styles.stainTypeCount}>
                ({data.correct}/{data.total})
              </Text>
              {isPoorPerformance && (
                <TouchableOpacity
                  style={styles.emailStainButton}
                  onPress={() => handleEmailStainPerformance(stainType, data)}
                  disabled={isExporting}
                >
                  <Mail color="#FF6B6B" size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {renderAccuracyBar(data.accuracy)}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066CC", "#004499"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {showClearConfirm && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Reset Statistics</Text>
                <Text style={styles.modalText}>
                  Enter admin password to reset all statistics data.
                </Text>
                <TextInput
                  style={styles.modalPasswordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonDanger]}
                    onPress={handleClearData}
                  >
                    <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                      Reset
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Statistics</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading statistics...</Text>
              </View>
            ) : stats ? (
              <>
                {stats.totalFeedback === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <AlertTriangle color="#FFC107" size={48} />
                    <Text style={styles.emptyStateTitle}>No Data Yet</Text>
                    <Text style={styles.emptyStateText}>
                      Start identifying stains and providing feedback to see your statistics here.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.overallCard}>
                      <View style={styles.overallHeader}>
                        <Award color="#FFD700" size={28} />
                        <Text style={styles.overallTitle}>Overall Accuracy</Text>
                      </View>
                      <Text style={styles.overallAccuracy}>
                        {stats.accuracyRate.toFixed(1)}%
                      </Text>
                      {renderAccuracyBar(stats.accuracyRate)}
                      <View style={styles.overallStats}>
                        <View style={styles.overallStatItem}>
                          <Text style={styles.overallStatValue}>{stats.totalFeedback}</Text>
                          <Text style={styles.overallStatLabel}>Total</Text>
                        </View>
                        <View style={styles.overallStatItem}>
                          <Text style={[styles.overallStatValue, { color: "#4CAF50" }]}>
                            {stats.correctPredictions}
                          </Text>
                          <Text style={styles.overallStatLabel}>Correct</Text>
                        </View>
                        <View style={styles.overallStatItem}>
                          <Text style={[styles.overallStatValue, { color: "#FF6B6B" }]}>
                            {stats.incorrectPredictions}
                          </Text>
                          <Text style={styles.overallStatLabel}>Incorrect</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeader}>
                        <BarChart3 color="#0066CC" size={24} />
                        <Text style={styles.sectionTitle}>Stain Type Accuracy</Text>
                      </View>
                      <View style={styles.sectionContent}>
                        {renderStainTypeAccuracy()}
                      </View>
                    </View>

                    {stats.modelPerformance && Object.keys(stats.modelPerformance).length > 0 && (
                      <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                          <Target color="#0066CC" size={24} />
                          <Text style={styles.sectionTitle}>Model Performance</Text>
                        </View>
                        <View style={styles.sectionContent}>
                          {Object.entries(stats.modelPerformance)
                            .sort(([, a], [, b]) => b.total - a.total)
                            .map(([model, data]) => (
                              <View key={model} style={styles.modelRow}>
                                <View style={styles.modelHeader}>
                                  <Text style={styles.modelName}>
                                    {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Text>
                                  <View style={styles.modelStats}>
                                    <Text style={styles.modelAccuracy}>
                                      {data.accuracy.toFixed(1)}%
                                    </Text>
                                    <Text style={styles.modelCount}>
                                      ({data.correct}/{data.total})
                                    </Text>
                                  </View>
                                </View>
                                {renderAccuracyBar(data.accuracy)}
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    <View style={styles.insightsCard}>
                      <View style={styles.insightsHeader}>
                        <TrendingUp color="#4CAF50" size={24} />
                        <Text style={styles.insightsTitle}>Insights</Text>
                      </View>
                      <View style={styles.insightsList}>
                        {stats.accuracyRate >= 80 && (
                          <View style={styles.insightItem}>
                            <Text style={styles.insightIcon}>🎯</Text>
                            <Text style={styles.insightText}>
                              Excellent accuracy! The model is performing very well.
                            </Text>
                          </View>
                        )}
                        {stats.accuracyRate < 60 && (
                          <View style={styles.insightItem}>
                            <Text style={styles.insightIcon}>💡</Text>
                            <Text style={styles.insightText}>
                              Consider trying different models or providing more feedback to improve accuracy.
                            </Text>
                          </View>
                        )}
                        {stats.totalFeedback < 10 && (
                          <View style={styles.insightItem}>
                            <Text style={styles.insightIcon}>📊</Text>
                            <Text style={styles.insightText}>
                              More data needed. Continue using the app to get better insights.
                            </Text>
                          </View>
                        )}
                        {stats.totalFeedback >= 50 && (
                          <View style={styles.insightItem}>
                            <Text style={styles.insightIcon}>🏆</Text>
                            <Text style={styles.insightText}>
                              Great job! You have contributed {stats.totalFeedback} feedbacks to improve the model.
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.exportButton}
                      onPress={handleExportEmail}
                      disabled={isExporting}
                    >
                      <Mail color="#fff" size={20} />
                      <Text style={styles.exportButtonText}>
                        {isExporting ? 'Preparing Report...' : 'Export & Email Report'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.clearButton}
                      onPress={handleResetClick}
                    >
                      <Text style={styles.clearButtonText}>Reset Statistics</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load statistics</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
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
    fontSize: 16,
    color: "#fff",
    marginTop: 16,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  overallCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  overallHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  overallTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  overallAccuracy: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#0066CC",
    textAlign: "center",
    marginVertical: 8,
  },
  overallStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  overallStatItem: {
    alignItems: "center",
  },
  overallStatValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  overallStatLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sectionContent: {
    gap: 12,
  },
  stainTypeRow: {
    marginBottom: 16,
  },
  stainTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stainTypeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  stainTypeStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stainTypeAccuracy: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
  },
  stainTypeCount: {
    fontSize: 14,
    color: "#666",
  },
  modelRow: {
    marginBottom: 16,
  },
  modelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modelName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  modelStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modelAccuracy: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0066CC",
  },
  modelCount: {
    fontSize: 14,
    color: "#666",
  },
  accuracyBarContainer: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  accuracyBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  insightsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
  },
  insightIcon: {
    fontSize: 20,
    minWidth: 24,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: "#0066CC",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  clearButton: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },

  modalPasswordInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonDanger: {
    backgroundColor: "#FF6B6B",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  errorContainer: {
    alignItems: "center",
    paddingTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  stainTypeNameContainer: {
    flex: 1,
    gap: 6,
  },
  poorPerformanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  poorPerformanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  emailStainButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
