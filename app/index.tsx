import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HelpCircle, Brain, AlertCircle, BarChart3, Image as ImageIcon, Globe, LogOut } from "lucide-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStain } from "@/hooks/stain-context";
import { AVAILABLE_MODELS } from "@/utils/vision-ai";
import { useLanguage } from "@/hooks/language-context";
import { useAuth } from "@/hooks/auth-context";

export default function HomeScreen() {
  console.log('[HomeScreen] Component rendering...');
  const { selectedModel } = useStain();
  const { t } = useLanguage();
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    console.log('[HomeScreen] Logging out...');
    await logout();
  };
  console.log('[HomeScreen] Selected model:', selectedModel);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  const navigate = (path: string) => {
    console.log(`[HomeScreen] Navigating to ${path}...`);
    router.push(path as any);
  };
  
  const getSelectedModelName = () => {
    const model = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    const modelName = model?.name || "GPT-4 Vision";
    console.log('[HomeScreen] Model name:', modelName);
    return modelName;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerLogoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut color="#DC3545" size={20} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerHelpButton}
              onPress={() => setShowDisclaimer(true)}
              activeOpacity={0.8}
            >
              <HelpCircle color="#0066CC" size={24} />
            </TouchableOpacity>
            <View style={styles.ecolabContainer}>
              <Image
                testID="ecolabLogo"
                accessibilityLabel="Ecolab logo"
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/15nqz1cdwbbksoaii3az6' }}
                style={styles.ecolabLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.logoContainer}>
              <Image
                testID="stainIdLogo"
                accessibilityLabel="StainID logo"
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hjeohvsx3n2wmx6r5cyyq' }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text testID="versionText" style={styles.versionText}>{t('home.version')}</Text>
            <TouchableOpacity 
              style={styles.headerLanguageButton}
              onPress={() => navigate('/settings')}
              activeOpacity={0.8}
            >
              <Globe color="#0066CC" size={18} />
              <Text style={styles.headerLanguageText}>Lang</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>
              {t('home.prototype')}
            </Text>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => navigate('/camera')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#0080FF", "#0066CC"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>{t('home.identifyStain')}</Text>
                <Text style={styles.buttonSubtext}>
                  {t('home.takePhoto')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{t('home.howItWorks')}</Text>
              <View style={styles.steps}>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>{t('home.step1')}</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>{t('home.step2')}</Text>
                </View>
                <View style={styles.step}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>{t('home.step3')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Section - Always Visible */}
          <View style={styles.footer}>
            {isAdmin && (
              <View style={styles.modelIndicator}>
                <Text style={styles.modelIndicatorText}>
                  {t('home.using')}: {getSelectedModelName()}
                </Text>
              </View>
            )}
            <View style={styles.footerButtons}>
              {[
                ...(isAdmin ? [{ icon: Brain, label: t('home.models'), action: () => navigate('/models') }] : []),
                { icon: BarChart3, label: t('home.stats'), action: () => navigate('/statistics') },
                { icon: ImageIcon, label: t('home.gallery'), action: () => navigate('/gallery') }
              ].map(({ icon: Icon, label, action }, i) => (
                <TouchableOpacity key={i} style={styles.footerButton} onPress={action} activeOpacity={0.8}>
                  <Icon color="#0066CC" size={20} />
                  <Text style={styles.footerButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.footerText}>
              {t('home.copyright')}
            </Text>
          </View>

          {showDisclaimer && (
            <View style={styles.disclaimerOverlay}>
              <View style={styles.disclaimerModal}>
                <View style={styles.disclaimerHeader}>
                  <AlertCircle color="#FF6B00" size={24} />
                  <Text style={styles.disclaimerTitle}>{t('home.disclaimer.title')}</Text>
                  <TouchableOpacity 
                    style={styles.disclaimerClose}
                    onPress={() => setShowDisclaimer(false)}
                  >
                    <Text style={styles.disclaimerCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.disclaimerContent}>
                  <Text style={styles.disclaimerSubtitle}>{t('home.disclaimer.subtitle')}</Text>
                  <Text style={styles.disclaimerText}>
                    {t('home.disclaimer.text')}
                  </Text>
                  <Text style={styles.disclaimerSectionTitle}>{t('home.disclaimer.importantNotes')}</Text>
                  <Text style={styles.disclaimerBullet}>{t('home.disclaimer.note1')}</Text>
                  <Text style={styles.disclaimerBullet}>{t('home.disclaimer.note2')}</Text>
                  <Text style={styles.disclaimerBullet}>{t('home.disclaimer.note3')}</Text>
                  <Text style={styles.disclaimerBullet}>{t('home.disclaimer.note4')}</Text>
                  <Text style={styles.disclaimerSectionTitle}>{t('home.disclaimer.contact')}</Text>
                  <Text style={styles.disclaimerContact}>omer.ahmad@ecolab.com</Text>
                  <Text style={styles.disclaimerContact}>mara.carver@ecolab.com</Text>
                  <Text style={styles.disclaimerContact}>benjamin.schaefer@ecolab.com</Text>
                  <Text style={styles.disclaimerContact}>nicholas.dylla@ecolab.com</Text>
                  <Text style={styles.disclaimerFooter}>
                    {t('home.disclaimer.footer')}
                  </Text>
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    position: "relative",
  },
  headerLogoutButton: {
    position: "absolute",
    top: 20,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DC3545",
  },
  headerHelpButton: {
    position: "absolute",
    top: 20,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0066CC",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: 160,
    height: 48,
    marginBottom: 6,
  },
  ecolabContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  ecolabLogo: {
    width: 220,
    height: 60,
  },
  versionText: {
    fontSize: 12,
    color: "#0066CC",
    fontWeight: "700",
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0066CC",
    letterSpacing: -0.5,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  mainButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  buttonSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  steps: {
    gap: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0066CC",
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "600",
    fontSize: 12,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  footer: {
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modelIndicator: {
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: "center",
  },
  modelIndicatorText: {
    color: "#0066CC",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  footerButton: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    minWidth: 70,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  headerLanguageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#0066CC",
    marginTop: 6,
    marginBottom: 6,
  },
  headerLanguageText: {
    color: "#0066CC",
    fontSize: 12,
    fontWeight: "600",
  },
  footerButtonText: {
    color: "#0066CC",
    fontSize: 12,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  disclaimerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  disclaimerModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxWidth: 400,
    width: "100%",
    maxHeight: "80%",
  },
  disclaimerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  disclaimerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 12,
  },
  disclaimerClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  disclaimerCloseText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
  },
  disclaimerContent: {
    padding: 20,
    maxHeight: 400,
  },
  disclaimerSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 12,
    textAlign: "center",
  },
  disclaimerText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 16,
  },
  disclaimerSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  disclaimerBullet: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 4,
  },
  disclaimerContact: {
    fontSize: 14,
    color: "#0066CC",
    marginBottom: 4,
  },
  disclaimerFooter: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 18,
  },
});