import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Colors } from "../../../constants/Colors";
import StyleDefault from "../../../constants/DefaultStyles";
import BackBtn from "../../../components/BackButton";
import Btn from "../../../components/CustomButton";
import UnsavedChangesModal from "../../../components/settings/UnsavedChangesModal";
import { useUnsavedChangesGuard } from "../../../components/settings/useUnsavedChangesGuard";
import { getAuth } from "@react-native-firebase/auth";
import {
  getUserSettings,
  updateUserSettings,
  type UserSettings,
} from "../../../lib/users";

function accessibilityDirty(
  draft: UserSettings | null,
  saved: UserSettings | null
): boolean {
  if (!draft || !saved) return false;
  return (
    !!draft.large_text !== !!saved.large_text ||
    !!draft.high_contrast_map !== !!saved.high_contrast_map
  );
}

export default function AccessibilitySettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const navigation = useNavigation();

  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [savedSettings, setSavedSettings] = useState<UserSettings | null>(null);
  const [draft, setDraft] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setLoading(true);
    getUserSettings(user.uid)
      .then((s) => {
        if (cancelled) return;
        setSavedSettings(s);
        setDraft(s);
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const isDirty = accessibilityDirty(draft, savedSettings);

  function handleDiscardAccessibility() {
    setDraft(savedSettings ? { ...savedSettings } : null);
  }

  const [saving, setSaving] = useState(false);
  async function handleSaveAccessibility() {
    if (!user || !draft) return;
    setSaving(true);
    try {
      const updated = await updateUserSettings(user.uid, {
        large_text: draft.large_text,
        high_contrast_map: draft.high_contrast_map,
      });
      setSavedSettings(updated);
      setDraft(updated);
    } catch {
      // swallow errors for now
    } finally {
      setSaving(false);
    }
  }

  const {
    showUnsavedModal,
    handleSave: handleGuardSave,
    handleDiscard: handleGuardDiscard,
    saving: guardSaving,
  } = useUnsavedChangesGuard(navigation as never, {
    isDirty,
    onSave: handleSaveAccessibility,
    onDiscard: handleDiscardAccessibility,
    allowLeave: saving,
  });

  function updateDraft(partial: Partial<UserSettings>) {
    if (!draft) return;
    setDraft({ ...draft, ...partial });
  }

  if (loading || !draft) {
    return (
      <SafeAreaView style={defaultStyles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              ...defaultStyles.subtitle,
              marginTop: 12,
              color: colors.text,
            }}
          >
            Loading accessibility settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={defaultStyles.container}>
      <UnsavedChangesModal
        visible={showUnsavedModal}
        onSave={handleGuardSave}
        onDiscard={handleGuardDiscard}
        saving={guardSaving}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <BackBtn onPress={() => router.back()} />
        <Text
          style={{
            ...defaultStyles.title,
            marginLeft: 12,
          }}
        >
          Accessibility & appearance
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              ...defaultStyles.subtitle,
              marginBottom: 8,
              color: colors.textMuted,
            }}
          >
            Text
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Outfit_400Regular",
                fontSize: 14,
                color: colors.text,
                flex: 1,
              }}
            >
              Larger text
            </Text>
            <Switch
              value={!!draft.large_text}
              onValueChange={(value) =>
                updateDraft({ large_text: value })
              }
              trackColor={{
                false: colors.bg,
                true: colors.primary,
              }}
              thumbColor={colors.bgDark}
            />
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              ...defaultStyles.subtitle,
              marginBottom: 8,
              color: colors.textMuted,
            }}
          >
            Map
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "Outfit_400Regular",
                fontSize: 14,
                color: colors.text,
                flex: 1,
              }}
            >
              High contrast map
            </Text>
            <Switch
              value={!!draft.high_contrast_map}
              onValueChange={(value) =>
                updateDraft({ high_contrast_map: value })
              }
              trackColor={{
                false: colors.bg,
                true: colors.primary,
              }}
              thumbColor={colors.bgDark}
            />
          </View>
        </View>
      </ScrollView>
      {isDirty && (
        <View
          style={{
            position: "absolute",
            right: 16,
            bottom: 24,
          }}
        >
          <Btn
            text={saving ? "Saving..." : "Save changes"}
            onPress={handleSaveAccessibility}
            disabled={saving}
            styleBtn={{
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 10,
              minWidth: 140,
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

