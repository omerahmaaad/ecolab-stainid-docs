import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import type { CameraView } from 'expo-camera';
import type { MutableRefObject } from 'react';

export interface AutofocusHandle {
  cleanup: () => void;
  onCameraReady: () => void;
}

const MOTION_THRESHOLD_IOS = 0.25;
const MOTION_THRESHOLD_ANDROID = 0.35;
const REFOCUS_DELAY_IOS = 100;
const REFOCUS_DELAY_ANDROID = 200;

function getMotionThreshold(): number {
  return Platform.OS === 'ios' ? MOTION_THRESHOLD_IOS : MOTION_THRESHOLD_ANDROID;
}

function getRefocusDelay(): number {
  return Platform.OS === 'ios' ? REFOCUS_DELAY_IOS : REFOCUS_DELAY_ANDROID;
}

async function triggerCameraRefocus(cameraRef: MutableRefObject<CameraView | null>): Promise<void> {
  try {
    if (!cameraRef.current) return;

    if (Platform.OS === 'ios') {
      const camera = cameraRef.current as any;
      if (camera.resumePreview && typeof camera.resumePreview === 'function') {
        await camera.resumePreview();
        console.log('[Autofocus-iOS] Preview resumed for refocus');
      } else if (camera._cameraRef?.current?.resumePreview) {
        await camera._cameraRef.current.resumePreview();
        console.log('[Autofocus-iOS] Internal preview resumed');
      } else {
        console.log('[Autofocus-iOS] No resumePreview method, relying on native autofocus');
      }
    } else if (Platform.OS === 'android') {
      const camera = cameraRef.current as any;
      if (camera.pausePreview && camera.resumePreview) {
        await camera.pausePreview();
        await new Promise(resolve => setTimeout(resolve, 50));
        await camera.resumePreview();
        console.log('[Autofocus-Android] Pause/resume cycle completed');
      } else {
        console.log('[Autofocus-Android] Relying on native continuous autofocus');
      }
    }
  } catch {
    console.log('[Autofocus] Refocus attempt completed (may use native AF)');
  }
}

export function setupCameraAutofocus(
  cameraRef: MutableRefObject<CameraView | null>,
  isCapturing: boolean
): AutofocusHandle {
  if (Platform.OS === 'web') {
    return {
      cleanup: () => {},
      onCameraReady: () => {},
    };
  }

  let subscription: { remove: () => void } | null = null;
  let focusTimeout: ReturnType<typeof setTimeout> | null = null;
  const lastMotion = { x: 0, y: 0, z: 0 };
  let isReady = false;

  const setupMotionDetection = async () => {
    try {
      const available = await Accelerometer.isAvailableAsync();
      if (!available) {
        console.log(`[Autofocus-${Platform.OS}] Accelerometer not available, using native autofocus only`);
        return;
      }

      const updateInterval = Platform.OS === 'ios' ? 80 : 120;
      Accelerometer.setUpdateInterval(updateInterval);

      subscription = Accelerometer.addListener((accelerometerData) => {
        if (!isReady || isCapturing) return;

        const { x, y, z } = accelerometerData;
        const deltaX = Math.abs(x - lastMotion.x);
        const deltaY = Math.abs(y - lastMotion.y);
        const deltaZ = Math.abs(z - lastMotion.z);
        const totalDelta = deltaX + deltaY + deltaZ;

        if (totalDelta > getMotionThreshold()) {
          if (focusTimeout) {
            clearTimeout(focusTimeout);
          }

          focusTimeout = setTimeout(() => {
            if (!isCapturing && isReady) {
              triggerCameraRefocus(cameraRef);
            }
          }, getRefocusDelay());
        }

        lastMotion.x = x;
        lastMotion.y = y;
        lastMotion.z = z;
      });

      console.log(`[Autofocus-${Platform.OS}] Motion-based refocus enabled (threshold: ${getMotionThreshold()}, delay: ${getRefocusDelay()}ms)`);
    } catch {
      console.log(`[Autofocus-${Platform.OS}] Setup failed, using native autofocus`);
    }
  };

  setupMotionDetection();

  return {
    cleanup: () => {
      if (subscription) {
        subscription.remove();
        subscription = null;
      }
      if (focusTimeout) {
        clearTimeout(focusTimeout);
        focusTimeout = null;
      }
      isReady = false;
      console.log(`[Autofocus-${Platform.OS}] Cleaned up`);
    },
    onCameraReady: () => {
      isReady = true;
      console.log(`[Autofocus-${Platform.OS}] Camera ready, autofocus active`);
      
      if (Platform.OS === 'android') {
        setTimeout(() => {
          triggerCameraRefocus(cameraRef);
        }, 500);
      }
    },
  };
}

export function cleanupAutofocus(handle: AutofocusHandle): void {
  handle.cleanup();
}
