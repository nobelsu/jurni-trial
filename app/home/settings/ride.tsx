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
import { faCar } from "@fortawesome/free-solid-svg-icons/faCar";
import { faVanShuttle } from "@fortawesome/free-solid-svg-icons/faVanShuttle";
import { faComments } from "@fortawesome/free-solid-svg-icons/faComments";

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

const RIDE_TYPES = [
  {
    id: "basic" as const,
    label: "Basic",
    description: "Affordable everyday rides",
    icon: faCar,
    iconColor: "#6b7280",
  },
  {
    id: "comfort" as const,
    label: "Comfort",
    description: "More space, newer vehicles",
    icon: faCar,
    iconColor: "#0ea5e9",
  },
  {
    id: "xl" as const,
    label: "XL",
    description: "Extra room for groups",
    icon: faVanShuttle,
    iconColor: "#8b5cf6",
  },
];

export default function RideSettingsScreen() {
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

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <BackBtn onPress={() => router.back()} />
        <Text style={{ ...defaultStyles.title, marginLeft: 12 }}>
          Ride preferences
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: isDirty ? 104 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ride type selector */}
        <View style={{ marginBottom: 20 }}>
          <Text style={sectionLabel}>Default ride type</Text>
          <View style={card}>
            {RIDE_TYPES.map((type, index) => {
              const isSelected = draft.default_ride_type === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => updateDraft({ default_ride_type: type.id })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.bgDark,
                  }}
                >
                  <View style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: colors.bgDark,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                  }}>
                    <FontAwesomeIcon
                      icon={type.icon}
                      size={16}
                      color={isSelected ? type.iconColor : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: "Outfit_600SemiBold",
                      fontSize: 15,
                      color: colors.text,
                      marginBottom: 1,
                    }}>
                      {type.label}
                    </Text>
                    <Text style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 12,
                      color: colors.textMuted,
                    }}>
                      {type.description}
                    </Text>
                  </View>
                  {/* Radio indicator */}
                  <View style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.textDull,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                    {isSelected && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#ffffff",
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ride style */}
        <View style={{ marginBottom: 24 }}>
          <Text style={sectionLabel}>Ride style</Text>
          <View style={{ ...card, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: colors.bgDark,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 14,
              }}>
                <FontAwesomeIcon icon={faComments} size={16} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 15,
                  color: colors.text,
                }}>
                  Quiet rides
                </Text>
                <Text style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 2,
                }}>
                  Prefer less conversation during trips
                </Text>
              </View>
              <Switch
                value={!!draft.silent_only}
                onValueChange={(value) => updateDraft({ silent_only: value })}
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
            onPress={handleDiscardRide}
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
            onPress={handleSaveRide}
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
