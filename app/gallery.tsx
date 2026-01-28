import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { X, Calendar, CheckCircle, XCircle, Sparkles, Trash2, Folder, ChevronRight, Home, ArrowLeft, Mail, AlertTriangle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getFeedbackData, FeedbackEntry, resetFeedbackStats, exportFeedbackToEmail, exportStainPerformanceToEmail, getFeedbackStats } from "@/utils/feedback-storage";

interface StainFolder {
  stainType: string;
  count: number;
  scans: FeedbackEntry[];
  accuracy?: number;
  correctCount?: number;
}

export default function GalleryScreen() {
  const [scans, setScans] = useState<FeedbackEntry[]>([]);
  const [folders, setFolders] = useState<StainFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<StainFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<FeedbackEntry | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<{ uri: string; scan: FeedbackEntry } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const loadScans = async () => {
    console.log('[Gallery] Loading scans...');
    setIsLoading(true);
    try {
      const data = await getFeedbackData();
      console.log('[Gallery] Loaded', data.length, 'scans');
      setScans(data);
      
      const stats = await getFeedbackStats();
      
      const folderMap = new Map<string, FeedbackEntry[]>();
      data.forEach(scan => {
        const stainType = scan.predictedStainType;
        if (!folderMap.has(stainType)) {
          folderMap.set(stainType, []);
        }
        folderMap.get(stainType)!.push(scan);
      });
      
      const folderList: StainFolder[] = Array.from(folderMap.entries())
        .map(([stainType, scans]) => {
          const stainStats = stats.stainTypeAccuracy[stainType];
          return {
            stainType,
            count: scans.length,
            scans: scans.sort((a, b) => b.timestamp - a.timestamp),
            accuracy: stainStats?.accuracy,
            correctCount: stainStats?.correct,
          };
        })
        .sort((a, b) => b.count - a.count);
      
      console.log('[Gallery] Created', folderList.length, 'folders');
      setFolders(folderList);
    } catch (error) {
      console.error('[Gallery] Failed to load scans:', error);
      setScans([]);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
  };

  const handleReset = () => {
    setShowPasswordModal(true);
  };

  const handleConfirmReset = async () => {
    if (password !== "stainid123") {
      Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      return;
    }

    try {
      await resetFeedbackStats();
      await loadScans();
      setShowPasswordModal(false);
      setPassword("");
      Alert.alert('Success', 'Gallery has been reset successfully.');
    } catch (error) {
      console.error('Failed to reset gallery:', error);
      Alert.alert('Error', 'Failed to reset gallery.');
    }
  };

  const handleCancelReset = () => {
    setShowPasswordModal(false);
    setPassword("");
  };

  const handleExportEmail = async () => {
    console.log('[Gallery] Exporting feedback to email...');
    setIsExporting(true);
    try {
      const result = await exportFeedbackToEmail();
      if (result.success) {
        Alert.alert('Export Success', result.message);
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error: any) {
      console.error('[Gallery] Export error:', error);
      Alert.alert('Error', 'Failed to export feedback data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportStainPerformance = async (folder: StainFolder) => {
    if (!folder.accuracy || folder.accuracy >= 60) {
      Alert.alert('Info', 'This stain type is performing well. No need to send a report.');
      return;
    }
    
    console.log('[Gallery] Exporting stain performance for:', folder.stainType);
    setIsExporting(true);
    try {
      const stainData = {
        accuracy: folder.accuracy,
        correct: folder.correctCount || 0,
        total: folder.count,
      };
      const result = await exportStainPerformanceToEmail(folder.stainType, stainData, folder.scans);
      if (result.success) {
        Alert.alert('Export Success', result.message);
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error: any) {
      console.error('[Gallery] Export stain error:', error);
      Alert.alert('Error', 'Failed to export stain performance data.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStainColor = (stainType: string) => {
    const colors: Record<string, string> = {
      makeup: "#FF6B9D",
      foundation: "#FEC8D8",
      blood: "#C44569",
      "boot polish": "#2C3E50",
      dirt: "#8B6F47",
      wine: "#722F37",
      coffee: "#6F4E37",
      food: "#FF8C42",
    };
    return colors[stainType?.toLowerCase() || ""] || "#0066CC";
  };

  const renderFolderItem = ({ item }: { item: StainFolder }) => {
    const isPoorPerformance = item.accuracy !== undefined && item.accuracy < 60 && item.count >= 3;
    
    return (
      <TouchableOpacity
        style={styles.folderCard}
        onPress={() => setSelectedFolder(item)}
      >
        <View style={[styles.folderIconContainer, { backgroundColor: getStainColor(item.stainType) }]}>
          <Folder color="#fff" size={32} />
        </View>
        <View style={styles.folderInfo}>
          <Text style={styles.folderName}>
            {item.stainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          <View style={styles.folderMetaRow}>
            <Text style={styles.folderCount}>
              {item.count} {item.count === 1 ? 'scan' : 'scans'}
            </Text>
            {item.accuracy !== undefined && (
              <Text style={[styles.folderAccuracy, { color: item.accuracy >= 80 ? '#4CAF50' : item.accuracy >= 60 ? '#FFC107' : '#FF6B6B' }]}>
                {item.accuracy.toFixed(0)}% accurate
              </Text>
            )}
          </View>
          {isPoorPerformance && (
            <View style={styles.folderPoorPerformanceBadge}>
              <AlertTriangle color="#FF6B6B" size={12} />
              <Text style={styles.folderPoorPerformanceText}>Needs Improvement</Text>
            </View>
          )}
        </View>
        {isPoorPerformance ? (
          <TouchableOpacity
            style={styles.folderEmailButton}
            onPress={(e) => {
              e.stopPropagation();
              handleExportStainPerformance(item);
            }}
            disabled={isExporting}
          >
            <Mail color="#FF6B6B" size={18} />
          </TouchableOpacity>
        ) : (
          <ChevronRight color="#999" size={20} />
        )}
      </TouchableOpacity>
    );
  };

  const renderScanItem = ({ item }: { item: FeedbackEntry }) => {
    const imageUri = (() => {
      const raw = item.imageWithFlash.trim();
      if (raw.startsWith('data:')) return raw;
      const cleaned = raw.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
      const isPng = cleaned.startsWith('iVBOR');
      const isJpeg = cleaned.startsWith('/9j/');
      const mime = isPng ? 'image/png' : (isJpeg ? 'image/jpeg' : 'image/jpeg');
      return `data:${mime};base64,${cleaned}`;
    })();

    return (
    <TouchableOpacity
      style={styles.scanCard}
      onPress={() => setFullScreenImage({
        uri: imageUri,
        scan: item
      })}
    >
      <Image
        source={{ 
          uri: (() => {
            const raw = item.imageWithoutFlash.trim();
            if (raw.startsWith('data:')) return raw;
            const cleaned = raw.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
            const isPng = cleaned.startsWith('iVBOR');
            const isJpeg = cleaned.startsWith('/9j/');
            const mime = isPng ? 'image/png' : (isJpeg ? 'image/jpeg' : 'image/jpeg');
            return `data:${mime};base64,${cleaned}`;
          })()
        }}
        style={styles.scanThumbnail}
      />
      <View style={styles.scanInfo}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanStainType}>
            {item.predictedStainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          {item.userFeedback === 'correct' ? (
            <CheckCircle color="#4CAF50" size={16} />
          ) : (
            <XCircle color="#FF6B6B" size={16} />
          )}
        </View>
        <Text style={styles.scanCategory}>{item.predictedCategory}</Text>
        <View style={styles.scanFooter}>
          <Calendar color="#999" size={12} />
          <Text style={styles.scanDate}>{formatDate(item.timestamp)}</Text>
        </View>
        {item.userFeedback === 'incorrect' && item.correctedStainType && (
          <View style={styles.correctionBadge}>
            <Text style={styles.correctionText}>
              Corrected to: {item.correctedStainType}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066CC", "#004499"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={selectedFolder ? handleBackToFolders : handleClose}
            >
              {selectedFolder ? (
                <ArrowLeft color="#fff" size={24} />
              ) : (
                <X color="#fff" size={24} />
              )}
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.breadcrumb}>
                {!selectedFolder ? (
                  <View style={styles.breadcrumbItem}>
                    <Home color="#fff" size={16} />
                    <Text style={styles.headerTitle}>Gallery</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.breadcrumbItem}
                      onPress={handleBackToFolders}
                    >
                      <Home color="rgba(255,255,255,0.7)" size={14} />
                      <Text style={styles.breadcrumbText}>Gallery</Text>
                    </TouchableOpacity>
                    <ChevronRight color="rgba(255,255,255,0.5)" size={16} />
                    <View style={styles.breadcrumbItem}>
                      <Text style={styles.breadcrumbTextActive}>
                        {selectedFolder.stainType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              {selectedFolder && (
                <Text style={styles.folderSubtitle}>
                  {selectedFolder.count} {selectedFolder.count === 1 ? 'scan' : 'scans'}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton} 
                onPress={handleExportEmail}
                disabled={scans.length === 0 || isExporting}
              >
                <Mail color={scans.length === 0 ? "rgba(255,255,255,0.3)" : "#fff"} size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionButton} 
                onPress={handleReset}
                disabled={scans.length === 0}
              >
                <Trash2 color={scans.length === 0 ? "rgba(255,255,255,0.3)" : "#fff"} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading scans...</Text>
            </View>
          ) : scans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Sparkles color="#FFC107" size={48} />
              <Text style={styles.emptyTitle}>No Scans Yet</Text>
              <Text style={styles.emptyText}>
                Start identifying stains to see your scan history here.
              </Text>
            </View>
          ) : selectedFolder ? (
            <FlatList
              data={selectedFolder.scans}
              renderItem={renderScanItem}
              keyExtractor={(item) => item.id || String(item.timestamp)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={folders}
              renderItem={renderFolderItem}
              keyExtractor={(item) => item.stainType}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </LinearGradient>

      <Modal
        visible={selectedScan !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedScan(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Details</Text>
              <TouchableOpacity 
                onPress={() => setSelectedScan(null)}
                style={styles.modalCloseButton}
              >
                <X color="#666" size={24} />
              </TouchableOpacity>
            </View>
            
            {selectedScan && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.imageRow}>
                  <View style={styles.modalImageWrapper}>
                    <Image
                      source={{ 
                        uri: (() => {
                          const raw = selectedScan.imageWithoutFlash.trim();
                          if (raw.startsWith('data:')) return raw;
                          const cleaned = raw.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
                          const isPng = cleaned.startsWith('iVBOR');
                          const isJpeg = cleaned.startsWith('/9j/');
                          const mime = isPng ? 'image/png' : (isJpeg ? 'image/jpeg' : 'image/jpeg');
                          return `data:${mime};base64,${cleaned}`;
                        })()
                      }}
                      style={styles.modalImage}
                    />
                    <Text style={styles.modalImageLabel}>Without Flash</Text>
                  </View>
                  <View style={styles.modalImageWrapper}>
                    <Image
                      source={{ 
                        uri: (() => {
                          const raw = selectedScan.imageWithFlash.trim();
                          if (raw.startsWith('data:')) return raw;
                          const cleaned = raw.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
                          const isPng = cleaned.startsWith('iVBOR');
                          const isJpeg = cleaned.startsWith('/9j/');
                          const mime = isPng ? 'image/png' : (isJpeg ? 'image/jpeg' : 'image/jpeg');
                          return `data:${mime};base64,${cleaned}`;
                        })()
                      }}
                      style={styles.modalImage}
                    />
                    <Text style={styles.modalImageLabel}>With Flash</Text>
                  </View>
                </View>

                <View 
                  style={[
                    styles.stainTypeBadge,
                    { backgroundColor: getStainColor(selectedScan.predictedStainType) }
                  ]}
                >
                  <Sparkles color="#fff" size={20} />
                  <Text style={styles.stainTypeBadgeText}>
                    {selectedScan.predictedStainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedScan.predictedCategory}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Model Used</Text>
                  <Text style={styles.detailValue}>
                    {selectedScan.modelUsed.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Scan Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedScan.timestamp)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Feedback Status</Text>
                  <View style={styles.feedbackStatus}>
                    {selectedScan.userFeedback === 'correct' ? (
                      <View style={styles.feedbackCorrect}>
                        <CheckCircle color="#4CAF50" size={20} />
                        <Text style={styles.feedbackCorrectText}>Correct Identification</Text>
                      </View>
                    ) : (
                      <View style={styles.feedbackIncorrect}>
                        <XCircle color="#FF6B6B" size={20} />
                        <Text style={styles.feedbackIncorrectText}>Incorrect Identification</Text>
                      </View>
                    )}
                  </View>
                </View>

                {selectedScan.userFeedback === 'incorrect' && selectedScan.correctedStainType && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Corrected To</Text>
                    <View 
                      style={[
                        styles.correctedBadge,
                        { backgroundColor: getStainColor(selectedScan.correctedStainType) }
                      ]}
                    >
                      <Text style={styles.correctedBadgeText}>
                        {selectedScan.correctedStainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      {selectedScan.correctedCategory && (
                        <Text style={styles.correctedCategory}>
                          {selectedScan.correctedCategory}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={fullScreenImage !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity 
            style={styles.fullScreenCloseButton} 
            onPress={() => setFullScreenImage(null)}
          >
            <X color="#fff" size={28} />
          </TouchableOpacity>
          
          {fullScreenImage && (
            <>
              <Image
                source={{ uri: fullScreenImage.uri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <View style={styles.stainInfoCorner}>
                <Text style={styles.stainInfoLabel}>Stain Type</Text>
                <Text style={styles.stainInfoValue}>
                  {fullScreenImage.scan.predictedStainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                
                <Text style={[styles.stainInfoLabel, { marginTop: 12 }]}>Detection</Text>
                <View style={styles.detectionRow}>
                  {fullScreenImage.scan.userFeedback === 'correct' ? (
                    <CheckCircle color="#4CAF50" size={14} />
                  ) : (
                    <XCircle color="#FF6B6B" size={14} />
                  )}
                  <Text style={styles.stainInfoValue}>
                    {fullScreenImage.scan.userFeedback === 'correct' ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
                
                <Text style={[styles.stainInfoLabel, { marginTop: 12 }]}>Time of Scan</Text>
                <Text style={styles.stainInfoValue}>
                  {formatDate(fullScreenImage.scan.timestamp)}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>

      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelReset}
      >
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModalContainer}>
            <Text style={styles.passwordModalTitle}>Reset Gallery</Text>
            <Text style={styles.passwordModalText}>
              Enter password to delete all scans. This action cannot be undone.
            </Text>
            <TextInput
              style={styles.passwordModalInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.passwordModalButtons}>
              <TouchableOpacity 
                style={styles.passwordModalButton}
                onPress={handleCancelReset}
              >
                <Text style={styles.passwordModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.passwordModalButton, styles.passwordModalButtonDanger]}
                onPress={handleConfirmReset}
              >
                <Text style={[styles.passwordModalButtonText, { color: "#fff" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  breadcrumbTextActive: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  folderSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  folderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  folderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 14,
    color: "#999",
  },
  scanCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  scanInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scanStainType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  scanCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  scanFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scanDate: {
    fontSize: 12,
    color: "#999",
  },
  correctionBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  correctionText: {
    fontSize: 11,
    color: "#F57C00",
    fontWeight: "500",
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
    maxHeight: "90%",
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
  modalContent: {
    padding: 20,
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  modalImageWrapper: {
    flex: 1,
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalImageLabel: {
    fontSize: 12,
    color: "#666",
  },
  stainTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  stainTypeBadgeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  feedbackStatus: {
    marginTop: 4,
  },
  feedbackCorrect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  feedbackCorrectText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4CAF50",
  },
  feedbackIncorrect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  feedbackIncorrectText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FF6B6B",
  },
  correctedBadge: {
    padding: 12,
    borderRadius: 8,
  },
  correctedBadgeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  correctedCategory: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  stainInfoCorner: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 180,
  },
  stainInfoLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stainInfoValue: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  detectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  passwordModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  passwordModalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordModalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  passwordModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  passwordModalButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  passwordModalButtonDanger: {
    backgroundColor: "#FF6B6B",
  },
  passwordModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  folderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  folderAccuracy: {
    fontSize: 12,
    fontWeight: "600",
  },
  folderPoorPerformanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  folderPoorPerformanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  folderEmailButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
