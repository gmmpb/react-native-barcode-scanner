import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Clipboard,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";

// Get status bar height for proper layout adjustment
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

export default function BarcodeScannerScreen() {
  const [scannedData, setScannedData] = useState<{
    data: string;
    type: string;
    timestamp: Date;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<
    {
      data: string;
      type: string;
      timestamp: Date;
    }[]
  >([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle automatic scanner toggle based on scan state
  useEffect(() => {
    if (scannedData) {
      // Auto close scanner when we have data
      setCameraEnabled(false);
    }
  }, [scannedData]);

  // Copy feedback timer clear
  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const handleBarCodeScanned = (data: string, type: string) => {
    const newScan = {
      data,
      type,
      timestamp: new Date(),
    };

    setScannedData(newScan);
    setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans
    setScannerVisible(false);
  };

  const toggleCamera = () => {
    if (!cameraEnabled) {
      setScannerVisible(true);
    } else {
      setScannerVisible(false);
    }
    setCameraEnabled(!cameraEnabled);
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);

    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }

    copyTimeout.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const clearCurrentScan = () => {
    setScannedData(null);
    setCameraEnabled(true);
    setScannerVisible(true);
  };

  const selectHistoryItem = (item: (typeof scanHistory)[0]) => {
    setScannedData(item);
    setCameraEnabled(false);
    setScannerVisible(false);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Fix for Android status bar overlap */}
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={Platform.OS === "android"}
      />

      {/* Add a spacer view to account for translucent status bar on Android */}
      {Platform.OS === "android" && (
        <View
          style={{
            height: STATUS_BAR_HEIGHT,
            backgroundColor: colors.background,
          }}
        />
      )}

      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        {/* Main Container */}
        <ThemedView style={styles.container}>
          {/* Header with app title and scan button */}
          <ThemedView
            style={[styles.header, { borderBottomColor: colors.border }]}
          >
            <View style={styles.headerLeft}>
              <ThemedText style={styles.headerTitle}>Barcode Reader</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Scan and manage barcodes
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.scanButton,
                {
                  backgroundColor: cameraEnabled
                    ? colors.error
                    : colors.primary,
                },
              ]}
              onPress={toggleCamera}
            >
              <IconSymbol
                name={cameraEnabled ? "xmark" : "camera.fill"}
                size={20}
                color={colors.buttonText}
              />
              <ThemedText style={styles.scanButtonText}>
                {cameraEnabled ? "Close" : "Scan"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Main content area */}
          <ThemedView style={styles.content}>
            {/* Current scan result section */}
            <ThemedView
              style={[
                styles.currentScanContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Current Scan
                </ThemedText>

                {scannedData && (
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={clearCurrentScan}
                  >
                    <IconSymbol name="xmark" size={16} color={colors.icon} />
                  </TouchableOpacity>
                )}
              </View>

              {scannedData ? (
                <View style={styles.scanDataContainer}>
                  <View style={styles.scanMetaRow}>
                    <View
                      style={[
                        styles.scanTypeChip,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <IconSymbol
                        name={
                          scannedData.type.toLowerCase().includes("qr")
                            ? "qrcode"
                            : "barcode"
                        }
                        size={14}
                        color={colors.buttonText}
                      />
                      <ThemedText style={styles.scanTypeText}>
                        {scannedData.type.toUpperCase()}
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.timeText}>
                      {formatTime(scannedData.timestamp)}
                    </ThemedText>
                  </View>

                  <ThemedView
                    style={[
                      styles.dataDisplay,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <ScrollView style={styles.dataScroll}>
                      <ThemedText selectable={true} style={styles.dataText}>
                        {scannedData.data}
                      </ThemedText>
                    </ScrollView>

                    <View style={styles.dataActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: copied
                              ? colors.secondary
                              : colors.primary,
                          },
                        ]}
                        onPress={() => copyToClipboard(scannedData.data)}
                      >
                        <IconSymbol
                          name={copied ? "checkmark.circle.fill" : "doc.text"}
                          size={16}
                          color={colors.buttonText}
                        />
                        <ThemedText style={styles.actionButtonText}>
                          {copied ? "Copied!" : "Copy"}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </ThemedView>
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <IconSymbol name="barcode" size={40} color={colors.icon} />
                  <ThemedText style={styles.emptyStateText}>
                    No barcode scanned yet
                  </ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.emptyStateButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={toggleCamera}
                  >
                    <IconSymbol
                      name="camera.fill"
                      size={16}
                      color={colors.buttonText}
                    />
                    <ThemedText style={styles.actionButtonText}>
                      Scan a Barcode
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </ThemedView>

            {/* History section */}
            <ThemedView
              style={[
                styles.historyContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Scan History
                </ThemedText>
              </View>

              {scanHistory.length > 0 ? (
                <ScrollView style={styles.historyList}>
                  {scanHistory.map((item, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.historyItem,
                        {
                          backgroundColor: pressed
                            ? colors.border
                            : scannedData?.data === item.data
                            ? `${colors.primary}20`
                            : "transparent",
                        },
                      ]}
                      onPress={() => selectHistoryItem(item)}
                    >
                      <View style={styles.historyItemLeft}>
                        <IconSymbol
                          name={
                            item.type.toLowerCase().includes("qr")
                              ? "qrcode"
                              : "barcode"
                          }
                          size={20}
                          color={colors.icon}
                        />
                        <View style={styles.historyItemContent}>
                          <ThemedText
                            style={styles.historyItemData}
                            numberOfLines={1}
                            ellipsizeMode="middle"
                          >
                            {item.data}
                          </ThemedText>
                          <ThemedText style={styles.historyItemMeta}>
                            {item.type.toUpperCase()} •{" "}
                            {formatTime(item.timestamp)}
                          </ThemedText>
                        </View>
                      </View>

                      <IconSymbol
                        name="chevron.right"
                        size={16}
                        color={colors.icon}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyHistoryContainer}>
                  <ThemedText style={styles.emptyHistoryText}>
                    No scan history yet
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </ThemedView>

          {/* Scanner Modal */}
          <Modal
            visible={scannerVisible}
            animationType="slide"
            onRequestClose={() => {
              setScannerVisible(false);
              setCameraEnabled(false);
            }}
            statusBarTranslucent={true}
          >
            <View style={styles.scannerModal}>
              <View style={styles.scannerContainer}>
                <BarcodeScanner
                  onScan={handleBarCodeScanned}
                  enabled={cameraEnabled}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.closeScannerButton,
                  {
                    backgroundColor: colors.error,
                    top:
                      Platform.OS === "android" ? STATUS_BAR_HEIGHT + 20 : 50,
                  },
                ]}
                onPress={toggleCamera}
              >
                <IconSymbol name="xmark" size={20} color={colors.buttonText} />
              </TouchableOpacity>
            </View>
          </Modal>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scanButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  currentScanContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
    minHeight: 200,
    maxHeight: "45%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  scanDataContainer: {
    flex: 1,
    padding: 16,
  },
  scanMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scanTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  scanTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  dataDisplay: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  dataScroll: {
    flex: 1,
    padding: 12,
  },
  dataText: {
    fontSize: 15,
    lineHeight: 22,
  },
  dataActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    padding: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 8,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  historyContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flex: 1,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  historyItemData: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  historyItemMeta: {
    fontSize: 11,
    opacity: 0.6,
  },
  emptyHistoryContainer: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  scannerModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerContainer: {
    flex: 1,
  },
  closeScannerButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
