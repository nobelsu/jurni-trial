import { useEffect } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";

interface ToastProps {
    message: string | null;
    visible: boolean;
    onDismiss: () => void;
}

export default function Toast({ message, visible, onDismiss }: ToastProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    useEffect(() => {
        if (!visible || !message) return;
        const timeout = setTimeout(() => {
            onDismiss();
        }, 4500);
        return () => clearTimeout(timeout);
    }, [visible, message, onDismiss]);

    if (!visible || !message) return null;

    return (
        <View
            style={{
                position: "absolute",
                bottom: 220,
                left: 20,
                right: 20,
                zIndex: 2000,
                alignItems: "center",
            }}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onDismiss}
                style={{
                    maxWidth: 480,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: colors.bg,
                    borderWidth: 1,
                    borderColor: colors.textDull,
                    shadowColor: "#000",
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                }}
            >
                <Text
                    style={{
                        color: colors.text,
                        fontSize: 14,
                        textAlign: "center",
                    }}
                >
                    {message}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

