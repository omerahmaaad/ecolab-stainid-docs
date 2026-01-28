import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions, FlashMode } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { router } from "expo-router";
import { X, Zap, ZapOff, Camera as CameraIcon, Info } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStain } from "@/hooks/stain-context";
import { useLanguage } from "@/hooks/language-context";

// Maximum image size in bytes (400KB for Android to avoid 413 errors)
const MAX_IMAGE_SIZE = 400 * 1024;
const TARGET_WIDTH = 640; // Resize to max 640px width for faster processing

const { width } = Dimensions.get("window");
const FRAME_SIZE = width * 0.65;

export default function CameraScreen() {
  const [facing] = useState<CameraType>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState<"ready" | "no-flash" | "flash">("ready");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const flashModeRef = useRef<FlashMode>("off");
  const { setImages, clearImages } = useStain();
  const { t } = useLanguage();

  useEffect(() => {
    clearImages();
  }, [clearImages]);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Keep ref in sync with state
  useEffect(() => {
    flashModeRef.current = flashMode;
  }, [flashMode]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>{t("camera.permission")}</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t("camera.grantPermission")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Compress image to reduce size for server upload - optimized for speed
  const compressImage = async (uri: string): Promise<string | null> => {
    try {
      console.log(`[Camera] [${Platform.OS}] Compressing image...`);
      const startTime = Date.now();

      // Single pass compression with low quality for speed
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: TARGET_WIDTH } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const elapsed = Date.now() - startTime;
      console.log(`[Camera] Compressed in ${elapsed}ms, size: ${result.base64?.length || 0} bytes`);

      if (result.base64) {
        return result.base64;
      }
      return null;
    } catch (error) {
      console.error(`[Camera] Compression error:`, error);
      return null;
    }
  };

  const takePhotoWithRetry = async (maxRetries: number = 2): Promise<string | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (!cameraRef.current) {
          console.log(`[Camera] No camera ref on attempt ${attempt + 1}`);
          continue;
        }

        console.log(`[Camera] Taking photo (attempt ${attempt + 1}), flash: ${flashModeRef.current}, platform: ${Platform.OS}`);

        const photo = await Promise.race([
          cameraRef.current.takePictureAsync({
            quality: 0.3, // Very low quality for faster capture on high-res cameras
            base64: false, // Don't get base64 directly, we'll compress first
            skipProcessing: true, // Skip processing for speed
            exif: false, // Don't include EXIF data
          }),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Photo capture timeout")), 15000)
          ),
        ]);

        if (photo?.uri) {
          console.log(`[Camera] Photo captured, URI: ${photo.uri.substring(0, 50)}...`);

          // Compress the image to reduce size
          const compressedBase64 = await compressImage(photo.uri);

          if (compressedBase64 && compressedBase64.length > 1000) {
            console.log(`[Camera] Photo ready, final base64 length: ${compressedBase64.length}`);
            return compressedBase64;
          } else {
            console.log(`[Camera] Compressed image invalid or too small`);
          }
        } else {
          console.log(`[Camera] Photo invalid or missing URI on attempt ${attempt + 1}`);
        }
      } catch (error) {
        console.error(`[Camera] Photo capture error on attempt ${attempt + 1}:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    return null;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing || !isCameraReady) {
      if (!isCameraReady) {
        Alert.alert("Please Wait", "Camera is still initializing...");
      }
      return;
    }

    setIsCapturing(true);
    console.log("[Camera] Starting dual photo capture...");

    try {
      // Step 1: Take photo WITHOUT flash
      console.log("[Camera] Step 1: Capturing without flash...");
      setCaptureStep("no-flash");
      setFlashMode("off");

      // Short delay for flash mode to apply
      await new Promise((resolve) => setTimeout(resolve, 150));

      const photoNoFlash = await takePhotoWithRetry();

      if (!photoNoFlash) {
        throw new Error("Failed to capture photo without flash. Please try again.");
      }
      console.log("[Camera] Photo without flash captured successfully");

      // Step 2: Take photo WITH flash
      console.log("[Camera] Step 2: Capturing with flash...");
      setCaptureStep("flash");
      setFlashMode("on");

      // Short delay for flash to prepare
      await new Promise((resolve) => setTimeout(resolve, 200));

      let photoWithFlash = await takePhotoWithRetry();

      // If flash photo failed, use the no-flash photo as fallback
      if (!photoWithFlash) {
        console.log("[Camera] Flash photo failed, using no-flash photo as fallback");
        photoWithFlash = photoNoFlash;
      } else {
        console.log("[Camera] Photo with flash captured successfully");
      }

      // Verify both images are valid
      if (!photoNoFlash || photoNoFlash.length < 1000) {
        throw new Error("Photos captured are invalid. Please try again.");
      }

      // Set images and navigate to analysis
      console.log("[Camera] Both photos ready, setting images and navigating...");
      console.log(`[Camera] No-flash photo size: ${photoNoFlash.length}, Flash photo size: ${photoWithFlash.length}`);

      setImages({
        withoutFlash: photoNoFlash,
        withFlash: photoWithFlash,
      });

      router.push("/analysis");
    } catch (error) {
      console.error("[Camera] Capture error:", error);
      Alert.alert(
        t("camera.captureError") || "Capture Error",
        error instanceof Error ? error.message : "Failed to capture photos. Please try again."
      );
    } finally {
      setIsCapturing(false);
      setCaptureStep("ready");
      setFlashMode("off");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
        onCameraReady={() => {
          console.log("[Camera] Ready");
          setIsCameraReady(true);
        }}
      >
        <SafeAreaView style={styles.cameraContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X color="#fff" size={28} />
            </TouchableOpacity>

            <View style={styles.flashIndicator}>
              {flashMode === "on" ? (
                <Zap color="#FFD700" size={24} fill="#FFD700" />
              ) : (
                <ZapOff color="#fff" size={24} />
              )}
            </View>
          </View>

          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <Text style={styles.frameText}>{t("camera.centerStain")}</Text>
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <View style={styles.instructionCard}>
              <Info color="#0066CC" size={16} />
              <Text style={styles.instructionText}>
                {captureStep === "no-flash"
                  ? t("camera.capturingNoFlash")
                  : captureStep === "flash"
                  ? t("camera.capturingFlash")
                  : t("camera.positionStain")}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.captureButton,
                (isCapturing || !isCameraReady) && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={isCapturing || !isCameraReady}
              activeOpacity={0.8}
            >
              {isCapturing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View style={styles.captureButtonInner}>
                  <CameraIcon color="#fff" size={32} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.captureHint}>{t("camera.takesPhotos")}</Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  flashIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  frameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#0066CC",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  frameText: {
    position: "absolute",
    top: -30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#0066CC",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 30,
    gap: 8,
  },
  instructionText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
  },
  captureHint: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
  permissionButton: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
