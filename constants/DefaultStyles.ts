import { ColorSchemeName, StyleSheet } from "react-native";
import { Colors } from "./Colors";

interface StyleDefaultProps {
    colorScheme : ColorSchemeName    
}

export default function StyleDefault({ colorScheme } : StyleDefaultProps) {
  const DefaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: Colors[colorScheme ?? "light"].bgDark,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: 20,
      paddingTop: 10,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Outfit_600SemiBold',
      color: Colors[colorScheme ?? "light"].text,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Outfit_400Regular',
      color: Colors[colorScheme ?? "light"].textMuted,
    },
    smallCard: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].secondary,
      backgroundColor: Colors[colorScheme ?? "light"].bgDark,
    },
    mediumCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].secondary,
      backgroundColor: Colors[colorScheme ?? "light"].bgDark,
    },
    largeCard: {
      borderRadius: 16,
      borderWidth: 4,
      borderColor: Colors[colorScheme ?? "light"].secondary,
      backgroundColor: Colors[colorScheme ?? "light"].bgDark,
    },
  });
  return DefaultStyles;
}