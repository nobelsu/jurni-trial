import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Colors } from "../../../constants/Colors";
import StyleDefault from "../../../constants/DefaultStyles";
import BackBtn from "../../../components/BackButton";
import UnsavedChangesModal from "../../../components/settings/UnsavedChangesModal";
import { useUnsavedChangesGuard } from "../../../components/settings/useUnsavedChangesGuard";
import { getAuth } from "@react-native-firebase/auth";
import {
  getUserSettings,
  updateUserSettings,
  type UserSettings,
} from "../../../lib/users";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { faTag } from "@fortawesome/free-solid-svg-icons/faTag";

function notificationsDirty(
  draft: UserSettings | null,
  saved: UserSettings | null
): boolean {
  if (!draft || !saved) return false;
  return (
    (draft.ride_updates_push !== false) !== (saved.ride_updates_push !== false) ||
    !!draft.promotions_push !== !!saved.promotions_push
  );
}

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = colorScheme === "dark";

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

  const isDirty = notificationsDirty(draft, savedSettings);

  function handleDiscardNotifications() {
    setDraft(savedSettings ? { ...savedSettings } : null);
  }

  const [saving, setSaving] = useState(false);
  async function handleSaveNotifications() {
    if (!user || !draft) return;
    setSaving(true);
    try {
      const updated = await updateUserSettings(user.uid, {
        ride_updates_push: draft.ride_updates_push,
        promotions_push: draft.promotions_push,
      });
      setSavedSettings(updated);
      setDraft(updated);
    } catch {
      // ignore errors for now
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
    onSave: handleSaveNotifications,
    onDiscard: handleDiscardNotifications,
    allowLeave: saving,
  });

  function updateDraft(partial: Partial<UserSettings>) {
    if (!draft) return;
    setDraft({ ...draft, ...partial });
  }

  const sectionLabel = {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  };

  const card = {
    borderRadius: 20,
    backgroundColor: colors.bg,
    overflow: "hidden" as const,
  };

  if (loading || !draft) {
    return (
      <SafeAreaView style={defaultStyles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{
            fontFamily: "Outfit_400Regular",
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 12,
          }}>
            Loading notification settings...
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

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <BackBtn onPress={() => router.back()} />
        <Text style={{ ...defaultStyles.title, marginLeft: 12 }}>
          Notifications
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: isDirty ? 104 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Push notifications */}
        <View style={{ marginBottom: 24 }}>
          <Text style={sectionLabel}>Push notifications</Text>
          <View style={card}>
            {/* Ride updates */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: colors.bgDark,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
              }}>
                <FontAwesomeIcon icon={faBell} size={16} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 15,
                  color: colors.text,
                }}>
                  Ride updates
                </Text>
                <Text style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 2,
                }}>
                  Driver arrivals and trip status changes
                </Text>
              </View>
              <Switch
                value={draft.ride_updates_push !== false}
                onValueChange={(value) =>
                  updateDraft({ ride_updates_push: value })
                }
                trackColor={{ false: colors.bgDark, true: colors.primary }}
                thumbColor={isDark ? colors.textMuted : "#ffffff"}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.bgDark }} />

            {/* Promotions */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: colors.bgDark,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
              }}>
                <FontAwesomeIcon icon={faTag} size={16} color="#f59e0b" />
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 15,
                  color: colors.text,
                }}>
                  Promotions
                </Text>
                <Text style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 2,
                }}>
                  Deals, discounts, and special offers
                </Text>
              </View>
              <Switch
                value={!!draft.promotions_push}
                onValueChange={(value) =>
                  updateDraft({ promotions_push: value })
                }
                trackColor={{ false: colors.bgDark, true: colors.primary }}
                thumbColor={isDark ? colors.textMuted : "#ffffff"}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Bar */}
      {isDirty && (
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          backgroundColor: colors.bgDark,
          borderTopWidth: 1,
          borderTopColor: colors.bg,
          gap: 10,
        }}>
          <TouchableOpacity
            onPress={handleDiscardNotifications}
            disabled={saving}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: colors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{
              fontFamily: "Outfit_500Medium",
              fontSize: 15,
              color: colors.textMuted,
            }}>
              Discard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveNotifications}
            disabled={saving}
            style={{
              flex: 2,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 15,
              color: "#ffffff",
            }}>
              {saving ? "Saving..." : "Save changes"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
