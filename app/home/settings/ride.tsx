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
import Btn from "../../../components/CustomButton";
import BackBtn from "../../../components/BackButton";
import UnsavedChangesModal from "../../../components/settings/UnsavedChangesModal";
import { useUnsavedChangesGuard } from "../../../components/settings/useUnsavedChangesGuard";
import { getAuth } from "@react-native-firebase/auth";
import {
  getUserSettings,
  updateUserSettings,
  type UserSettings,
} from "../../../lib/users";

function settingsDirty(
  draft: UserSettings | null,
  saved: UserSettings | null
): boolean {
  if (!draft || !saved) return false;
  return (
    draft.default_ride_type !== saved.default_ride_type ||
    !!draft.silent_only !== !!saved.silent_only
  );
}

export default function RideSettingsScreen() {
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

  const isDirty = settingsDirty(draft, savedSettings);

  function handleDiscardRide() {
    setDraft(savedSettings ? { ...savedSettings } : null);
  }

  const [saving, setSaving] = useState(false);
  async function handleSaveRide() {
    if (!user || !draft) return;
    setSaving(true);
    try {
      const updated = await updateUserSettings(user.uid, {
        default_ride_type: draft.default_ride_type,
        silent_only: draft.silent_only,
      });
      setSavedSettings(updated);
      setDraft(updated);
    } catch {
      // soft-fail: leave UI as-is if update fails
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
    onSave: handleSaveRide,
    onDiscard: handleDiscardRide,
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
            Loading ride preferences...
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
          Ride preferences
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
            Default ride type
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {(["basic", "comfort", "xl"] as const).map((type) => (
              <View
                key={type}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  borderWidth:
                    draft.default_ride_type === type ? 0 : 1,
                  borderColor: colors.textDull,
                  backgroundColor:
                    draft.default_ride_type === type
                      ? colors.primary
                      : colors.bg,
                }}
              >
                <Btn
                  text={type.toUpperCase()}
                  onPress={() =>
                    updateDraft({
                      default_ride_type: type,
                    })
                  }
                  styleBtn={{
                    backgroundColor: "transparent",
                    paddingVertical: 10,
                  }}
                  styleTxt={{
                    fontSize: 14,
                    color:
                      draft.default_ride_type === type
                        ? colors.bgDark
                        : colors.text,
                  }}
                />
              </View>
            ))}
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
            Quiet rides
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
              Prefer quiet rides
            </Text>
            <Switch
              value={!!draft.silent_only}
              onValueChange={(value) =>
                updateDraft({ silent_only: value })
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
            onPress={handleSaveRide}
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

