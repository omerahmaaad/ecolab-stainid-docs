import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Eye, EyeOff, AlertCircle, User, Scan } from "lucide-react-native";
import { useAuth } from "@/hooks/auth-context";

export default function LoginScreen() {
  const { login, hasSavedCredentials, savedUsername, loginWithBiometrics, canUseBiometrics } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username) {
      setError("Please enter your username");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("[Login] Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await loginWithBiometrics();
      if (!result.success) {
        setError(result.error || "Biometric login failed");
      }
    } catch (err) {
      console.error("[Login] Biometric error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066CC", "#004499", "#003377"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              <View style={styles.logoSection}>
                <Image
                  source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/15nqz1cdwbbksoaii3az6' }}
                  style={styles.ecolabLogo}
                  resizeMode="contain"
                />
                <Image
                  source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hjeohvsx3n2wmx6r5cyyq' }}
                  style={styles.stainIdLogo}
                  resizeMode="contain"
                />
                <Text style={styles.subtitle}>Stain Identification System</Text>
              </View>

              <View style={styles.formSection}>
                <View style={styles.formCard}>
                  <Text style={styles.welcomeText}>Welcome Back</Text>
                  <Text style={styles.instructionText}>Sign in to continue</Text>

                  {error ? (
                    <View style={styles.errorContainer}>
                      <AlertCircle color="#DC3545" size={16} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <User color="#0066CC" size={20} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#999"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      testID="username-input"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Lock color="#0066CC" size={20} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      testID="password-input"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff color="#666" size={20} />
                      ) : (
                        <Eye color="#666" size={20} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    testID="login-button"
                  >
                    <LinearGradient
                      colors={isLoading ? ["#999", "#777"] : ["#0080FF", "#0066CC"]}
                      style={styles.loginButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {hasSavedCredentials && canUseBiometrics && (
                    <TouchableOpacity
                      style={[styles.biometricButton, isLoading && styles.loginButtonDisabled]}
                      onPress={handleBiometricLogin}
                      disabled={isLoading}
                      activeOpacity={0.8}
                      testID="biometric-button"
                    >
                      <Scan color="#0066CC" size={22} />
                      <Text style={styles.biometricButtonText}>
                        Sign in as {savedUsername} with Face ID
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.footerText}>
                  © 2024 Ecolab Inc. All Rights Reserved
                </Text>
                <Text style={styles.footerVersion}>Version 1.1</Text>
              </View>
            </View>
          </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  ecolabLogo: {
    width: 200,
    height: 55,
    marginBottom: 16,
  },
  stainIdLogo: {
    width: 140,
    height: 42,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  formSection: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#DC3545",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#0066CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 0.3,
  },
  biometricButton: {
    marginTop: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#0066CC",
    gap: 10,
  },
  biometricButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#0066CC",
  },
  footerSection: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
  },
});
