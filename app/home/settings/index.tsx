import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Colors } from "../../../constants/Colors";
import StyleDefault from "../../../constants/DefaultStyles";
import UnsavedChangesModal from "../../../components/settings/UnsavedChangesModal";
import { useUnsavedChangesGuard } from "../../../components/settings/useUnsavedChangesGuard";
import { getAuth } from "@react-native-firebase/auth";
import {
  getUserSettings,
  getFavourites,
  toggleFavourite,
  getUserProfileMeta,
  getUserVerificationStatus,
  updateUserSettings,
  setUserProfileName,
  type UserSettings,
  type UserProfileMeta,
  type SearchHistoryEntry,
} from "../../../lib/users";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCar } from "@fortawesome/free-solid-svg-icons/faCar";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons/faShieldHalved";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { faUniversalAccess } from "@fortawesome/free-solid-svg-icons/faUniversalAccess";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SettingsHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = colorScheme === "dark";

  const auth = getAuth();
  const user = auth.currentUser;

  const [loadingQuick, setLoadingQuick] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [draftSettings, setDraftSettings] = useState<UserSettings | null>(null);
  const [profileMeta, setProfileMeta] = useState<UserProfileMeta | null>(null);
  const [favourites, setFavourites] = useState<SearchHistoryEntry[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");
  const [savingName, setSavingName] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [showDrawerUnsavedModal, setShowDrawerUnsavedModal] = useState(false);
  const [savingDrawer, setSavingDrawer] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoadingQuick(true);
    Promise.allSettled([
      getUserSettings(user.uid),
      getUserProfileMeta(user.uid),
      getFavourites(user.uid),
      getUserVerificationStatus(user.uid),
    ])
      .then((results) => {
        if (cancelled) return;
        const [settingsResult, metaResult, favsResult, verificationResult] = results;

        if (settingsResult.status === "fulfilled") {
          setSettings(settingsResult.value);
          setDraftSettings(settingsResult.value);
        }
        if (metaResult.status === "fulfilled") {
          setProfileMeta(metaResult.value);
        }
        if (favsResult.status === "fulfilled") {
          setFavourites(favsResult.value);
        }
        if (verificationResult.status === "fulfilled") {
          setVerified(verificationResult.value);
        } else {
          setVerified(false);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingQuick(false);
        setLoadingFavourites(false);
        setLoadingVerification(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (profileMeta) {
      setDisplayName(profileMeta.name);
    }
  }, [profileMeta?.name]);

  function updateDraftSettings(partial: Partial<UserSettings>) {
    if (!draftSettings) return;
    setDraftSettings({ ...draftSettings, ...partial });
  }

  const originalDisplayName = profileMeta?.name ?? "";
  const hasUnsavedName =
    displayName.trim() !== "" &&
    displayName.trim() !== originalDisplayName.trim();

  const hasUnsavedQuickSettings =
    !!settings &&
    !!draftSettings &&
    ((draftSettings.ride_updates_push !== false) !==
      (settings.ride_updates_push !== false) ||
      !!draftSettings.silent_only !== !!settings.silent_only);

  const hasUnsavedChanges = hasUnsavedName || hasUnsavedQuickSettings;

  async function handleSaveName() {
    if (!user || !profileMeta) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a valid name.");
      return;
    }
    try {
      setSavingName(true);
      const updatedMeta = await setUserProfileName(user.uid, trimmed);
      setProfileMeta(updatedMeta);
      setDisplayName(updatedMeta.name);
      Alert.alert("Saved", "Your name has been updated.");
    } catch {
      Alert.alert("Error", "Failed to save name. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleRemoveFavourite(entry: SearchHistoryEntry) {
    if (!user) return;
    try {
      const updated = await toggleFavourite(user.uid, entry);
      setFavourites(updated);
    } catch {
      // soft-fail; leave UI as-is if update fails
    }
  }

  function handleDiscardName() {
    setDisplayName(originalDisplayName);
  }

  function handleDiscardQuickSettings() {
    setDraftSettings(settings ? { ...settings } : null);
  }

  const [savingAll, setSavingAll] = useState(false);

  async function handleSaveAll() {
    if (!user) return;
    setSavingAll(true);
    try {
      if (hasUnsavedName) {
        await handleSaveName();
      }
      if (hasUnsavedQuickSettings && draftSettings) {
        const updated = await updateUserSettings(user.uid, {
          ride_updates_push: draftSettings.ride_updates_push,
          silent_only: draftSettings.silent_only,
        });
        setSettings(updated);
        setDraftSettings(updated);
      }
    } finally {
      setSavingAll(false);
    }
  }

  function handleDiscardAll() {
    handleDiscardName();
    handleDiscardQuickSettings();
  }

  const {
    showUnsavedModal,
    handleSave: handleGuardSave,
    handleDiscard: handleGuardDiscard,
    saving: guardSaving,
  } = useUnsavedChangesGuard(navigation as never, {
    isDirty: hasUnsavedChanges,
    onSave: handleSaveAll,
    onDiscard: handleDiscardAll,
    allowLeave: savingAll,
  });

  const primaryItems = [
    {
      title: "Identity verification",
      description: verified ? "Your account is verified" : "Verify your identity to book rides",
      route: "/home/settings/verification",
      icon: faShieldHalved,
      iconColor: "#f59e0b",
    },
    {
      title: "Account & profile",
      description: "Email, password, account controls",
      route: "/home/settings/account",
      icon: faUser,
      iconColor: colors.primary,
    },
    {
      title: "Ride preferences",
      description: "Default ride type, quiet rides",
      route: "/home/settings/ride",
      icon: faCar,
      iconColor: "#0ea5e9",
    },
  ];

  const secondaryItems = [
    {
      title: "Notifications",
      description: "Ride updates, promos, push alerts",
      route: "/home/settings/notifications",
      icon: faBell,
      iconColor: "#8b5cf6",
    },
    {
      title: "Accessibility & appearance",
      description: "Text size, contrast, visual comfort",
      route: "/home/settings/accessibility",
      icon: faUniversalAccess,
      iconColor: "#10b981",
    },
  ];

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

  return (
    <SafeAreaView style={defaultStyles.container}>
      <UnsavedChangesModal
        visible={showUnsavedModal}
        onSave={handleGuardSave}
        onDiscard={handleGuardDiscard}
        saving={guardSaving}
      />
      <UnsavedChangesModal
        visible={showDrawerUnsavedModal}
        onSave={async () => {
          setSavingDrawer(true);
          await handleSaveAll();
          setSavingDrawer(false);
          setShowDrawerUnsavedModal(false);
          navigation.dispatch(DrawerActions.toggleDrawer());
        }}
        onDiscard={() => {
          handleDiscardAll();
          setShowDrawerUnsavedModal(false);
          navigation.dispatch(DrawerActions.toggleDrawer());
        }}
        saving={savingDrawer}
        onCancel={() => {
          setShowDrawerUnsavedModal(false);
        }}
      />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => {
            if (hasUnsavedChanges) {
              setShowDrawerUnsavedModal(true);
            } else {
              navigation.dispatch(DrawerActions.toggleDrawer());
            }
          }}
          style={{
            height: 40,
            width: 40,
            borderRadius: 12,
            backgroundColor: colors.bg,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesomeIcon icon={faBars} size={16} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ ...defaultStyles.title, marginLeft: 12 }}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hasUnsavedChanges ? 104 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        {user && (
          <View style={{ marginBottom: 24 }}>
            <Text style={sectionLabel}>Profile</Text>
            <View style={{ ...card, padding: 20 }}>
              {loadingQuick || !settings || !profileMeta ? (
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 14,
                    color: colors.textMuted,
                    marginLeft: 10,
                  }}>
                    Loading profile...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Avatar + Name Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 14,
                    }}>
                      <Text style={{
                        fontFamily: "Outfit_600SemiBold",
                        fontSize: 20,
                        color: "#ffffff",
                        letterSpacing: 0.5,
                      }}>
                        {getInitials(displayName || profileMeta.name || "?")}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 11,
                        color: colors.textMuted,
                        marginBottom: 5,
                        letterSpacing: 0.3,
                      }}>
                        Display name
                      </Text>
                      <View style={{
                        borderBottomWidth: 1.5,
                        borderBottomColor: hasUnsavedName ? colors.primary : colors.bgLight,
                        paddingBottom: 3,
                      }}>
                        <TextInput
                          value={displayName}
                          onChangeText={setDisplayName}
                          placeholder="Your name"
                          placeholderTextColor={colors.textDull}
                          style={{
                            fontFamily: "Outfit_500Medium",
                            fontSize: 18,
                            color: colors.text,
                            padding: 0,
                          }}
                        />
                      </View>
                      {profileMeta.gender && (
                        <Text style={{
                          fontFamily: "Outfit_400Regular",
                          fontSize: 13,
                          color: colors.textMuted,
                          marginTop: 6,
                        }}>
                          {profileMeta.gender === "male"
                            ? "Male"
                            : profileMeta.gender === "female"
                            ? "Female"
                            : profileMeta.gender === "non_binary"
                            ? "Non-binary"
                            : "Prefer not to say"}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: colors.bgDark,
                    }}>
                      <FontAwesomeIcon icon={faCar} size={12} color={colors.primary} />
                      <Text style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 13,
                        color: colors.text,
                      }}>
                        {profileMeta.rides_taken} rides
                      </Text>
                    </View>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: colors.bgDark,
                    }}>
                      <FontAwesomeIcon icon={faStar} size={12} color="#f59e0b" />
                      <Text style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 13,
                        color: colors.text,
                      }}>
                        {profileMeta.rating.toFixed(1)} rating
                      </Text>
                    </View>
                  </View>

                  {/* Verification Row */}
                  <TouchableOpacity
                    onPress={() => router.push("/home/settings/verification")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.bgDark,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 20,
                    }}
                  >
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: loadingVerification
                        ? colors.textDull
                        : verified
                        ? "#10b981"
                        : "#f59e0b",
                      marginRight: 10,
                    }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 14,
                        color: colors.text,
                      }}>
                        Identity verification
                      </Text>
                      <Text style={{
                        fontFamily: "Outfit_400Regular",
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: 1,
                      }}>
                        {loadingVerification
                          ? "Checking status..."
                          : verified
                          ? "Your identity is verified"
                          : "Tap to verify your identity"}
                      </Text>
                    </View>
                    <FontAwesomeIcon icon={faChevronRight} size={11} color={colors.textMuted} />
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={{
                    height: 1,
                    backgroundColor: colors.bgDark,
                    marginHorizontal: -20,
                    marginBottom: 20,
                  }} />

                  {/* Quick Settings Label */}
                  <Text style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: colors.textMuted,
                    marginBottom: 14,
                  }}>
                    Quick settings
                  </Text>

                  {/* Ride Updates Toggle */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
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
                        Trip status and driver arrivals
                      </Text>
                    </View>
                    <Switch
                      value={
                        draftSettings
                          ? draftSettings.ride_updates_push !== false
                          : settings.ride_updates_push !== false
                      }
                      onValueChange={(value) =>
                        updateDraftSettings({ ride_updates_push: value })
                      }
                      trackColor={{ false: colors.bgDark, true: colors.primary }}
                      thumbColor={isDark ? colors.textMuted : "#ffffff"}
                    />
                  </View>

                  <View style={{ height: 1, backgroundColor: colors.bgDark, marginVertical: 10 }} />

                  {/* Quiet Rides Toggle */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
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
                      value={
                        draftSettings
                          ? !!draftSettings.silent_only
                          : !!settings.silent_only
                      }
                      onValueChange={(value) =>
                        updateDraftSettings({ silent_only: value })
                      }
                      trackColor={{ false: colors.bgDark, true: colors.primary }}
                      thumbColor={isDark ? colors.textMuted : "#ffffff"}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={sectionLabel}>Account</Text>
          <View style={card}>
            {primaryItems.map((item, index) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route)}
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
                  <FontAwesomeIcon icon={item.icon} size={16} color={item.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: "Outfit_600SemiBold",
                    fontSize: 15,
                    color: colors.text,
                    marginBottom: 1,
                  }}>
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 12,
                      color: colors.textMuted,
                    }}
                  >
                    {item.description}
                  </Text>
                </View>
                <FontAwesomeIcon icon={faChevronRight} size={11} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={sectionLabel}>Preferences</Text>
          <View style={card}>
            {secondaryItems.map((item, index) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route)}
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
                  <FontAwesomeIcon icon={item.icon} size={16} color={item.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: "Outfit_600SemiBold",
                    fontSize: 15,
                    color: colors.text,
                    marginBottom: 1,
                  }}>
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 12,
                      color: colors.textMuted,
                    }}
                  >
                    {item.description}
                  </Text>
                </View>
                <FontAwesomeIcon icon={faChevronRight} size={11} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Favourites Section */}
        {user && (
          <View style={{ marginBottom: 24 }}>
            <Text style={sectionLabel}>Favourites</Text>
            <View style={card}>
              {loadingFavourites ? (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 13,
                    color: colors.textMuted,
                    marginLeft: 10,
                  }}>
                    Loading favourites...
                  </Text>
                </View>
              ) : favourites.length === 0 ? (
                <View style={{ padding: 16 }}>
                  <Text style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 14,
                    color: colors.textMuted,
                  }}>
                    No saved locations yet
                  </Text>
                  <Text style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 12,
                    color: colors.textDull,
                    marginTop: 3,
                  }}>
                    Star a location during a ride to save it here.
                  </Text>
                </View>
              ) : (
                favourites.map((fav, index) => (
                  <View
                    key={`${fav.name}-${fav.full_address}-${index}`}
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
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.bgDark,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}>
                      <FontAwesomeIcon icon={faLocationDot} size={15} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 14,
                        color: colors.text,
                      }}>
                        {fav.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: "Outfit_400Regular",
                          fontSize: 12,
                          color: colors.textMuted,
                          marginTop: 1,
                        }}
                      >
                        {fav.full_address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveFavourite(fav)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        backgroundColor: colors.bgDark,
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 8,
                      }}
                    >
                      <FontAwesomeIcon icon={faXmark} size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Bar */}
      {hasUnsavedChanges && (
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
            onPress={handleDiscardAll}
            disabled={savingAll}
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
            onPress={handleSaveAll}
            disabled={savingAll}
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
              {savingAll ? "Saving..." : "Save changes"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
