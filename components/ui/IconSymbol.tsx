// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import React from "react";
import { OpaqueColorValue, StyleProp, ViewStyle } from "react-native";

import { TextStyle } from "react-native";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING: Record<
  string,
  React.ComponentProps<typeof MaterialIcons>["name"]
> = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "star.slash.fill": "flash-off",
  "camera.fill": "camera",
  "bolt.fill": "flash-on",
  "bolt.slash": "flash-off",
  xmark: "close",
  "doc.text": "description",
  gear: "settings",
  "info.circle": "info",
  "arrow.counterclockwise": "refresh",
  qrcode: "qr-code-scanner",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "photo.on.rectangle": "photo-library",
  trash: "delete",
};

// For TypeScript, we're relaxing the type to accept any string
export type IconSymbolName = string;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Add error handling for missing icon mappings
  if (!MAPPING[name]) {
    console.warn(
      `Icon mapping not found for: ${name}. Using 'help' icon as fallback.`
    );
    return (
      <MaterialIcons
        color={color}
        size={size}
        name="help"
        style={style as StyleProp<TextStyle>}
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style as StyleProp<TextStyle>}
    />
  );
}
