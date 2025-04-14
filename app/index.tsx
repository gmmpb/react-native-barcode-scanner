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
  Pressable,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { addBarcode, getBarcode, BarcodeResponse } from "@/services/barcodeApi";

// Get status bar height for proper layout adjustment
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

export default function BarcodeScannerScreen() {
  const [scannedData, setScannedData] = useState<{
    data: string;
    type: string;
    timestamp: Date;
    price?: string;
    exists?: boolean;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<
    {
      data: string;
      type: string;
      timestamp: Date;
      price?: string;
      exists?: boolean;
    }[]
  >([]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addBarcodeMode, setAddBarcodeMode] = useState(false);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [tempBarcode, setTempBarcode] = useState<{
    data: string;
    type: string;
  } | null>(null);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? "dark";
  const colors = Colors[colorScheme];

  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  // Copy feedback timer clear
  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const displayErrorMessage = (message: string, duration: number = 2000) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, duration);
  };

  const handleBarCodeScanned = async (data: string, type: string) => {
    // If in add barcode mode, prompt for price
    if (addBarcodeMode) {
      setTempBarcode({ data, type });
      setPriceModalVisible(true);
      return;
    }

    // Regular scan mode - check if barcode exists in API
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const barcodeData = await getBarcode(data);

      if (!barcodeData.exists) {
        displayErrorMessage("Barcode not found in the database.");
        setScannedData(null);
        return;
      }

      const newScan = {
        data,
        type,
        timestamp: new Date(),
        price: barcodeData.price?.toString(),
        exists: barcodeData.exists,
      };

      setScannedData(newScan);
      setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans
    } catch (error) {
      console.error("Error fetching barcode data:", error);
      displayErrorMessage(
        "Failed to fetch barcode data. Check your connection."
      );

      // Still add scan to history, but without price
      const newScan = {
        data,
        type,
        timestamp: new Date(),
      };

      setScannedData(newScan);
      setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBarcodeWithPrice = async () => {
    if (!tempBarcode || !price.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Convert price string to number
      const priceNumber = parseFloat(price.trim());

      if (isNaN(priceNumber)) {
        displayErrorMessage("Please enter a valid price.");
        return;
      }

      // Call API to add barcode
      const response = await addBarcode(tempBarcode.data, priceNumber);

      // Create new scan with the response data
      const newScan = {
        data: tempBarcode.data,
        type: tempBarcode.type,
        timestamp: new Date(),
        price: priceNumber.toString(),
        exists: true,
      };

      setScannedData(newScan);
      setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]); // Keep last 10 scans

      // Show success message
      Alert.alert(
        "Success",
        "Barcode added successfully with price: $" + priceNumber
      );

      // Reset temporary states
      setTempBarcode(null);
      setPrice("");
      setPriceModalVisible(false);
    } catch (error) {
      console.error("Error adding barcode:", error);
      displayErrorMessage("Failed to add barcode. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);

    // Reset add barcode mode when camera is turned off
    if (cameraEnabled) {
      setAddBarcodeMode(false);
    }
  };

  const toggleAddBarcodeMode = () => {
    setAddBarcodeMode(!addBarcodeMode);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
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
  };

  const selectHistoryItem = (item: (typeof scanHistory)[0]) => {
    setScannedData(item);
  };

  const clearHistory = () => {
    if (scanHistory.length > 0) {
      Alert.alert(
        "Clear History",
        "Are you sure you want to clear all scan history?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: () => setScanHistory([]),
          },
        ]
      );
    }
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
          {/* Header with app title and action buttons */}
          <ThemedView
            style={[styles.header, { borderBottomColor: colors.border }]}
          >
            <View style={styles.headerLeft}>
              <ThemedText style={styles.headerTitle}>Barcode Reader</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Scan and manage barcodes
              </ThemedText>
            </View>

            <View style={styles.headerActions}>
              {cameraEnabled && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: flashOn
                          ? colors.accent
                          : colors.surface,
                        marginRight: 8,
                      },
                    ]}
                    onPress={toggleFlash}
                  >
                    <IconSymbol
                      name={flashOn ? "bolt.fill" : "bolt.slash"}
                      size={20}
                      color={flashOn ? colors.buttonText : colors.icon}
                    />
                  </TouchableOpacity>

                  {/* Add Barcode Mode Toggle Button */}
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: addBarcodeMode
                          ? colors.secondary
                          : colors.surface,
                        marginRight: 8,
                      },
                    ]}
                    onPress={toggleAddBarcodeMode}
                  >
                    <IconSymbol
                      name="photo.on.rectangle"
                      size={20}
                      color={addBarcodeMode ? colors.buttonText : colors.icon}
                    />
                  </TouchableOpacity>
                </>
              )}

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
                  {cameraEnabled ? "Stop" : "Scan"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {/* Main content area */}
          <ThemedView style={styles.content}>
            {/* Scanner area (only shown when camera is enabled) */}
            {cameraEnabled && (
              <ThemedView
                style={[
                  styles.scannerContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {addBarcodeMode && (
                  <View style={styles.addBarcodeOverlay}>
                    <ThemedText style={styles.addBarcodeText}>
                      Scan to add barcode with price
                    </ThemedText>
                  </View>
                )}
                <BarcodeScanner
                  onScan={handleBarCodeScanned}
                  enabled={cameraEnabled}
                  flashEnabled={flashOn}
                  inlineMode={true}
                />
              </ThemedView>
            )}

            {/* Current scan result section */}
            <ThemedView
              style={[
                styles.currentScanContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  flex: cameraEnabled ? 0.4 : 0.5, // Adjust flex based on camera visibility
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

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <ThemedText style={styles.loadingText}>
                    Loading barcode data...
                  </ThemedText>
                </View>
              ) : scannedData ? (
                <View style={styles.scanDataContainer}>
                  <View style={styles.scanMetaRow}>
                    <View style={styles.scanMetaLeft}>
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
                              : "photo.on.rectangle"
                          }
                          size={14}
                          color={colors.buttonText}
                        />
                        <ThemedText style={styles.scanTypeText}>
                          {scannedData.type.toUpperCase()}
                        </ThemedText>
                      </View>

                      {scannedData.price ? (
                        <View
                          style={[
                            styles.priceChip,
                            { backgroundColor: colors.secondary },
                          ]}
                        >
                          <ThemedText style={styles.priceText}>
                            ${scannedData.price}
                          </ThemedText>
                        </View>
                      ) : scannedData.exists === false ? (
                        <View
                          style={[
                            styles.priceChip,
                            { backgroundColor: colors.warning },
                          ]}
                        >
                          <ThemedText style={styles.priceText}>
                            Not found
                          </ThemedText>
                        </View>
                      ) : null}
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

                      {scannedData.exists === false && (
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            {
                              backgroundColor: colors.secondary,
                              marginLeft: 8,
                            },
                          ]}
                          onPress={() => {
                            setTempBarcode({
                              data: scannedData.data,
                              type: scannedData.type,
                            });
                            setPriceModalVisible(true);
                          }}
                        >
                          <IconSymbol
                            name="photo.on.rectangle"
                            size={16}
                            color={colors.buttonText}
                          />
                          <ThemedText style={styles.actionButtonText}>
                            Add Price
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ThemedView>
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <IconSymbol
                    name="photo.on.rectangle"
                    size={32}
                    color={colors.icon}
                  />
                  <ThemedText style={styles.emptyStateText}>
                    No barcode scanned yet
                  </ThemedText>
                  {!cameraEnabled && (
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
                        Start Scanner
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {errorMessage && (
                <View
                  style={[
                    styles.errorContainer,
                    { backgroundColor: `${colors.error}20` },
                  ]}
                >
                  <IconSymbol
                    name="exclamationmark.triangle.fill"
                    size={16}
                    color={colors.error}
                  />
                  <ThemedText
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {errorMessage}
                  </ThemedText>
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
                  flex: cameraEnabled ? 0.6 : 0.5, // Adjust flex based on camera visibility
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Scan History
                </ThemedText>

                {scanHistory.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={clearHistory}
                  >
                    <IconSymbol name="trash" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
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
                              : "photo.on.rectangle"
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
                          <View style={styles.historyItemMeta}>
                            <ThemedText style={styles.historyItemMetaText}>
                              {item.type.toUpperCase()} •{" "}
                              {formatTime(item.timestamp)}
                            </ThemedText>
                            {item.price ? (
                              <ThemedText
                                style={[
                                  styles.historyItemPrice,
                                  { color: colors.secondary },
                                ]}
                              >
                                ${item.price}
                              </ThemedText>
                            ) : item.exists === false ? (
                              <ThemedText
                                style={[
                                  styles.historyItemPrice,
                                  { color: colors.warning },
                                ]}
                              >
                                Not found
                              </ThemedText>
                            ) : null}
                          </View>
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
                  <IconSymbol name="doc.text" size={28} color={colors.icon} />
                  <ThemedText style={styles.emptyHistoryText}>
                    No scan history yet
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>

      {/* Price Input Modal */}
      <Modal
        visible={priceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setPriceModalVisible(false);
          setTempBarcode(null);
          setPrice("");
          setErrorMessage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Price</ThemedText>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.background },
                ]}
                onPress={() => {
                  setPriceModalVisible(false);
                  setTempBarcode(null);
                  setPrice("");
                  setErrorMessage(null);
                }}
              >
                <IconSymbol name="xmark" size={16} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.modalText}>
              Enter price for barcode:
            </ThemedText>

            <ThemedText
              style={styles.barcodeText}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {tempBarcode?.data}
            </ThemedText>

            <View
              style={[
                styles.priceInputContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText style={styles.priceCurrency}>$</ThemedText>
              <TextInput
                style={[styles.priceInput, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={`${colors.text}50`}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
                autoFocus
              />
            </View>

            {errorMessage && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: `${colors.error}20` },
                ]}
              >
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={16}
                  color={colors.error}
                />
                <ThemedText style={[styles.errorText, { color: colors.error }]}>
                  {errorMessage}
                </ThemedText>
              </View>
            )}

            <View style={styles.modalActions}>
              {isLoading ? (
                <View style={styles.loadingButton}>
                  <ActivityIndicator size="small" color={colors.buttonText} />
                  <ThemedText style={styles.modalButtonText}>
                    Saving...
                  </ThemedText>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: colors.secondary },
                  ]}
                  onPress={handleAddBarcodeWithPrice}
                >
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={18}
                    color={colors.buttonText}
                  />
                  <ThemedText style={styles.modalButtonText}>
                    Add Barcode
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  scannerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    height: 200,
    position: "relative",
  },
  addBarcodeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 8,
    alignItems: "center",
  },
  addBarcodeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  currentScanContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 180,
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
  scanMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
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
  priceChip: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyItemMetaText: {
    fontSize: 11,
    opacity: 0.6,
  },
  historyItemPrice: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalText: {
    fontSize: 14,
    marginBottom: 8,
  },
  barcodeText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#CCCCCC",
  },
});
