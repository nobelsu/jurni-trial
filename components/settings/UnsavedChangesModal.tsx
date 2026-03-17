import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../../constants/Colors";

export interface UnsavedChangesModalProps {
  visible: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  saving?: boolean;
  onCancel?: () => void;
}

export default function UnsavedChangesModal({
  visible,
  onSave,
  onDiscard,
  saving = false,
  onCancel,
}: UnsavedChangesModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleSave = async () => {
    await onSave();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel ?? onDiscard}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          onStartShouldSetResponder={() => true}
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 16,
            backgroundColor: colors.bg,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 18,
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Unsaved changes
          </Text>
          <Text
            style={{
              fontFamily: "Outfit_400Regular",
              fontSize: 15,
              color: colors.textMuted,
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            You have unsaved changes. Save them before leaving or discard to
            revert.
          </Text>
          <View>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginBottom: onCancel ? 12 : 0,
              }}
            >
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 48,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.bgDark} />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Outfit_600SemiBold",
                      fontSize: 16,
                      color: colors.bgDark,
                    }}
                  >
                    Save changes
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDiscard}
                disabled={saving}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.textDull,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 16,
                    color: colors.text,
                  }}
                >
                  Discard changes
                </Text>
              </TouchableOpacity>
            </View>
            {onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                disabled={saving}
                style={{
                  paddingVertical: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
