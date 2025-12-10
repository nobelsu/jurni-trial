import { ColorSchemeName, StyleSheet } from "react-native";
import { Colors } from "./Colors";

interface StyleDefaultProps {
    colorScheme : ColorSchemeName    
}

export default function StyleDefault({ colorScheme } : StyleDefaultProps) {
  const DefaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme ?? "light"].primaryBackground,
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
      fontWeight: 600,
      color: Colors[colorScheme ?? "light"].text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: Colors[colorScheme ?? "light"].lighterText,
    },
    smallCard: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].borderColor,
      backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground,
    },
    mediumCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme ?? "light"].borderColor,
      backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground,
    },
    largeCard: {
      borderRadius: 16,
      borderWidth: 4,
      borderColor: Colors[colorScheme ?? "light"].borderColor,
      backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground,
    },
  });
  return DefaultStyles;
}