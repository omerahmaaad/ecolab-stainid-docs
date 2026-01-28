import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { X, CheckCircle, Globe, LogOut, User, Wifi } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "@/hooks/language-context";
import { useStain } from "@/hooks/stain-context";
import { useAuth } from "@/hooks/auth-context";
import { trpcClient } from "@/lib/trpc";

type APILanguage = 'english' | 'spanish';

export default function SettingsScreen() {
  const { locale, changeLanguage, t } = useLanguage();
  const { setAPILanguage } = useStain();
  const { user, logout, isAdmin } = useAuth();
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const languages = [
    { code: 'en', apiCode: 'english' as APILanguage, name: t('settings.english'), flag: '🇺🇸' },
    { code: 'es', apiCode: 'spanish' as APILanguage, name: t('settings.spanish'), flag: '🇪🇸' },
  ];

  const handleSelectLanguage = async (languageCode: string, apiCode: APILanguage) => {
    await changeLanguage(languageCode);
    await setAPILanguage(apiCode);
  };

  const handleLogout = async () => {
    await logout();
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('Testing...');
    console.log('[Settings] Testing backend connection...');
    console.log('[Settings] EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    
    try {
      const result = await trpcClient.settings.ping.query();
      console.log('[Settings] Ping successful:', result);
      setConnectionStatus('✅ Connected');
      Alert.alert('Connection Test', 'Backend is reachable!\n' + JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error('[Settings] Ping failed:', error);
      setConnectionStatus('❌ Failed');
      Alert.alert('Connection Error', error.message || 'Failed to reach backend');
    } finally {
      setTestingConnection(false);
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
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('settings.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe color="#fff" size={24} />
                <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                {t('settings.selectLanguage')}
              </Text>
              
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageCard,
                    locale === language.code && styles.selectedLanguageCard
                  ]}
                  onPress={() => handleSelectLanguage(language.code, language.apiCode)}
                  activeOpacity={0.8}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                  </View>
                  {locale === language.code && (
                    <CheckCircle color="#4CAF50" size={24} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Wifi color="#fff" size={24} />
                <Text style={styles.sectionTitle}>Connection Test</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Test backend connectivity and API endpoint
              </Text>
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={testConnection}
                disabled={testingConnection}
                activeOpacity={0.8}
              >
                <Text style={styles.testButtonText}>
                  {testingConnection ? 'Testing...' : 'Test Backend Connection'}
                </Text>
              </TouchableOpacity>
              
              {connectionStatus && (
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>{connectionStatus}</Text>
                  <Text style={styles.statusSubtext}>
                    Endpoint: {process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not configured'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User color="#fff" size={24} />
                <Text style={styles.sectionTitle}>Account</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Logged in as {user?.username} ({isAdmin ? 'Admin' : 'Tester'})
              </Text>
              
              <View style={styles.accountCard}>
                <View style={styles.accountInfo}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.accountName}>{user?.username}</Text>
                    <Text style={styles.accountRole}>
                      {isAdmin ? 'Administrator' : 'Tester'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LogOut color="#DC3545" size={20} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
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
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  languageCard: {
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
  selectedLanguageCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#F0F7FF",
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modelDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  accountRole: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    backgroundColor: "#FFF0F0",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FFDDDD",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC3545",
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  statusSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
