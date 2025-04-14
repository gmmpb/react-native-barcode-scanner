/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // Enhanced UI colors
    primary: tintColorLight,
    secondary: "#34B27B", // Green for success actions
    accent: "#F76808", // Orange for attention
    error: "#E54D2E", // Red for errors
    warning: "#F5A524", // Yellow for warnings
    info: "#0091FF", // Blue for info
    surface: "#F8F9FA", // Light surface for cards
    border: "#E6E8EB", // Light border
    overlay: "rgba(17, 24, 28, 0.5)", // Semi-transparent overlay for modals
    scannerFrame: "rgba(10, 126, 164, 0.6)", // Transparent primary color for scanner frames
    buttonText: "#FFFFFF", // White text for buttons
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // Enhanced UI colors
    primary: "#0EA5E9", // Brighter blue for dark mode
    secondary: "#4CC38A", // Brighter green for dark mode
    accent: "#FF8F59", // Brighter orange for dark mode
    error: "#FF6659", // Brighter red for dark mode
    warning: "#FFD426", // Brighter yellow for dark mode
    info: "#59C8FF", // Brighter info blue for dark mode
    surface: "#1E2324", // Dark surface for cards
    border: "#2A2F30", // Dark border
    overlay: "rgba(0, 0, 0, 0.7)", // Darker overlay for modals
    scannerFrame: "rgba(14, 165, 233, 0.6)", // Transparent primary color for scanner frames
    buttonText: "#FFFFFF", // White text for buttons
  },
};
