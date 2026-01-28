import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { 
  X, 
  CheckCircle,
  Info,
  Star,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useStain } from "@/hooks/stain-context";
import { useAuth } from "@/hooks/auth-context";

export default function ModelsScreen() {
  const { 
    aiModel,
    setAIModel
  } = useStain();
  const { isAdmin, user } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066CC", "#004499"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ecolab AI Models</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoCard}>
              <Info color="#0066CC" size={20} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Ecolab Digital AI</Text>
                <Text style={styles.infoText}>
                  Enterprise-grade AI for professional stain identification powered by Ecolab Digital AI.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Model Selection</Text>
              <Text style={styles.sectionSubtitle}>
                {isAdmin 
                  ? "Choose the AI model for stain analysis" 
                  : "Model selection is restricted to Sonnet for tester accounts"}
              </Text>
              
              {!isAdmin && (
                <View style={styles.restrictedBanner}>
                  <Info color="#FF6B00" size={16} />
                  <Text style={styles.restrictedText}>
                    Logged in as {user?.username} - Model locked to Sonnet
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[
                  styles.aiModelCard,
                  aiModel === 'sonnet' && styles.selectedAIModelCard
                ]}
                onPress={() => setAIModel('sonnet')}
                activeOpacity={0.8}
              >
                <View style={styles.aiModelInfo}>
                  <View style={styles.aiModelHeader}>
                    <Text style={styles.aiModelName}>Ecolab Stain ID with Claude</Text>
                    <View style={styles.accuracyBadge}>
                      <Star color="#FFD700" size={12} fill="#FFD700" />
                      <Text style={styles.accuracyText}>&gt;90%</Text>
                    </View>
                  </View>
                  <Text style={styles.aiModelDescription}>Powered by Databricks with Ecolab Stain knowledge base</Text>
                </View>
                {aiModel === 'sonnet' && (
                  <CheckCircle color="#4CAF50" size={24} />
                )}
              </TouchableOpacity>

              {isAdmin && (
                <TouchableOpacity
                  style={[
                    styles.aiModelCard,
                    aiModel === 'gemma' && styles.selectedAIModelCard
                  ]}
                  onPress={() => setAIModel('gemma')}
                  activeOpacity={0.8}
                >
                  <View style={styles.aiModelInfo}>
                    <View style={styles.aiModelHeader}>
                      <Text style={styles.aiModelName}>Ecolab Stain ID with Gemma</Text>
                      <View style={styles.accuracyBadge}>
                        <Star color="#FFD700" size={12} fill="#FFD700" />
                        <Text style={styles.accuracyText}>85%</Text>
                      </View>
                    </View>
                    <Text style={styles.aiModelDescription}>Powered by Databricks with Ecolab Stain knowledge base - lower accuracy</Text>
                  </View>
                  {aiModel === 'gemma' && (
                    <CheckCircle color="#4CAF50" size={24} />
                  )}
                </TouchableOpacity>
              )}
            </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  headerSpacer: {
    width: 40,
  },

  aiModelCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedAIModelCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#F0F7FF",
  },
  aiModelInfo: {
    flex: 1,
  },
  aiModelName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  aiModelDescription: {
    fontSize: 14,
    color: "#666",
  },
  aiModelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  accuracyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  restrictedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  restrictedText: {
    flex: 1,
    fontSize: 13,
    color: "#FF6B00",
    fontWeight: "500",
  },
});