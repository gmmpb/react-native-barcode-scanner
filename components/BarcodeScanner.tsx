import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Get status bar height for proper layout adjustment
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

export function BarcodeScanner({
  onScan,
  enabled = true,
  flashEnabled = false,
  inlineMode = false,
}: {
  onScan: (data: string, type: string) => void;
  enabled?: boolean;
  flashEnabled?: boolean;
  inlineMode?: boolean;
}) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  // Animated values
  const scanAnimatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnimatedValue = useRef(new Animated.Value(0)).current;

  // Start scanner animation
  useEffect(() => {
    if (!scanned && enabled) {
      // Reset scan line animation
      scanAnimatedValue.setValue(0);

      // Start scan line animation
      Animated.loop(
        Animated.timing(scanAnimatedValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animations
      scanAnimatedValue.stopAnimation();
      pulseAnimatedValue.stopAnimation();
    }

    return () => {
      // Clean up animations
      scanAnimatedValue.stopAnimation();
      pulseAnimatedValue.stopAnimation();
    };
  }, [scanned, enabled]);

  useEffect(() => {
    const getCameraPermissions = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");

        // Check if torch is available
        if (status === "granted") {
          const cameraInfo = await Camera.getCameraPermissionsAsync();
          setTorchAvailable(true); // In a real app, you would check if the device has a torch
        }
      } catch (error) {
        console.error("Error requesting camera permissions:", error);
        setHasPermission(false);
      }
    };

    if (enabled) {
      getCameraPermissions();
    }
  }, [enabled]);

  const handleBarcodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (!scanned) {
      setScanned(true);
      onScan(data, type);

      // Auto-reset scanner in inline mode after a short delay
      if (inlineMode) {
        setTimeout(() => {
          setScanned(false);
        }, 1500);
      }
    }
  };

  const resetScanner = () => {
    setScanned(false);
  };

  // Compute the scan line translation
  const scanLineTranslate = scanAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, SCAN_FRAME_SIZE - 10],
  });

  // Compute the pulse scale
  const pulseScale = pulseAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pulseOpacity = pulseAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  if (!enabled) {
    return (
      <ThemedView style={styles.disabledContainer}>
        <ThemedText style={styles.disabledText}>
          Camera is turned off
        </ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === null) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Animated.View
          style={[styles.loadingIndicator, { borderColor: colors.primary }]}
        />
        <ThemedText style={styles.loadingText}>
          Requesting camera access...
        </ThemedText>
      </ThemedView>
    );
  }

  if (hasPermission === false) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <IconSymbol
          name="exclamationmark.triangle.fill"
          size={32}
          color={colors.warning}
        />
        <ThemedText style={styles.permissionTitle}>
          Camera Access Required
        </ThemedText>
        <ThemedText style={styles.permissionText}>
          Please allow camera access to scan barcodes
        </ThemedText>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
            try {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === "granted");
            } catch (error) {
              console.error("Error requesting camera permissions:", error);
            }
          }}
        >
          <ThemedText style={styles.permissionButtonText}>
            Grant Permission
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, inlineMode && styles.inlineContainer]}>
      {!inlineMode && (
        <>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#000000"
            translucent={Platform.OS === "android"}
          />

          {Platform.OS === "android" && (
            <View
              style={{ height: STATUS_BAR_HEIGHT, backgroundColor: "#000000" }}
            />
          )}
        </>
      )}

      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "code39", "code128", "ean13", "ean8", "upc_e"],
        }}
        enableTorch={flashEnabled}
      >
        <View style={[styles.overlay, inlineMode && styles.inlineOverlay]}>
          {!inlineMode && (
            <View style={styles.scannerHeader}>
              <ThemedText style={styles.scannerTitle}>Scan Barcode</ThemedText>
            </View>
          )}

          <View
            style={[
              styles.scanFrameContainer,
              inlineMode && styles.inlineScanFrameContainer,
            ]}
          >
            {/* Pulse effect behind scan frame */}
            <Animated.View
              style={[
                styles.pulseEffect,
                {
                  borderColor: `${colors.primary}50`,
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
                inlineMode && {
                  width: INLINE_SCAN_FRAME_SIZE + 20,
                  height: INLINE_SCAN_FRAME_SIZE + 20,
                },
              ]}
            />

            {/* Main scan frame */}
            <View
              style={[
                styles.scanFrame,
                { borderColor: colors.primary },
                inlineMode && styles.inlineScanFrame,
              ]}
            >
              {/* Corner effects for the scan frame */}
              <View
                style={[styles.cornerTL, { borderColor: colors.primary }]}
              />
              <View
                style={[styles.cornerTR, { borderColor: colors.primary }]}
              />
              <View
                style={[styles.cornerBL, { borderColor: colors.primary }]}
              />
              <View
                style={[styles.cornerBR, { borderColor: colors.primary }]}
              />

              {/* Scan line */}
              {!scanned && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: colors.primary,
                      transform: [
                        {
                          translateY: inlineMode
                            ? scanAnimatedValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-5, INLINE_SCAN_FRAME_SIZE - 5],
                              })
                            : scanLineTranslate,
                        },
                      ],
                      width: inlineMode
                        ? INLINE_SCAN_FRAME_SIZE - 10
                        : SCAN_FRAME_SIZE - 10,
                    },
                  ]}
                />
              )}
            </View>
          </View>

          {!inlineMode && (
            <>
              <View style={styles.scannerGuide}>
                <ThemedText style={styles.scannerGuideText}>
                  Position barcode inside the frame
                </ThemedText>
              </View>

              {scanned && (
                <TouchableOpacity
                  style={[
                    styles.scanAgainButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={resetScanner}
                >
                  <IconSymbol
                    name="arrow.counterclockwise"
                    size={18}
                    color="#FFFFFF"
                  />
                  <ThemedText style={styles.scanAgainButtonText}>
                    Scan Again
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const { width, height } = Dimensions.get("window");
const SCAN_FRAME_SIZE = Math.min(width * 0.7, 250);
const INLINE_SCAN_FRAME_SIZE = Math.min(width * 0.5, 160);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  inlineContainer: {
    backgroundColor: "transparent",
    height: "100%",
  },
  disabledContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  disabledText: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 8,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  inlineOverlay: {
    justifyContent: "center",
    paddingBottom: 0,
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  scannerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  scanFrameContainer: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineScanFrameContainer: {
    // For the inline scanner
  },
  pulseEffect: {
    position: "absolute",
    width: SCAN_FRAME_SIZE + 20,
    height: SCAN_FRAME_SIZE + 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "transparent",
    overflow: "hidden",
    position: "relative",
  },
  inlineScanFrame: {
    width: INLINE_SCAN_FRAME_SIZE,
    height: INLINE_SCAN_FRAME_SIZE,
    borderRadius: 8,
  },
  scanLine: {
    width: SCAN_FRAME_SIZE - 10,
    height: 2,
    marginLeft: 5,
    borderRadius: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scannerGuide: {
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 20,
  },
  scannerGuideText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 20,
  },
  scanAgainButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
