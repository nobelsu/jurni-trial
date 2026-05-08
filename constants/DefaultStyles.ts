import { ColorSchemeName, StyleSheet } from "react-native";
import { Colors } from "./Colors";

interface StyleDefaultProps {
    colorScheme : ColorSchemeName    
}

export default function StyleDefault({ colorScheme } : StyleDefaultProps) {
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const DefaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: Colors[themeKey].bgDark,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 20,
      paddingTop: 10,
    },
    title: {
      fontSize: 22,
      fontFamily: 'Outfit_600SemiBold',
      color: Colors[themeKey].text,
    },
    subtitle: {
      fontSize: 18,
      fontFamily: 'Outfit_400Regular',
      color: Colors[themeKey].textMuted,
    },
    smallCard: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors[themeKey].secondary,
      backgroundColor: Colors[themeKey].bgDark,
    },
    mediumCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[themeKey].secondary,
      backgroundColor: Colors[themeKey].bgDark,
    },
    largeCard: {
      borderRadius: 16,
      borderWidth: 4,
      borderColor: Colors[themeKey].secondary,
      backgroundColor: Colors[themeKey].bgDark,
    },
  });
  return DefaultStyles;
}