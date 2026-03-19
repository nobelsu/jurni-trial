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
import Btn from "../../../components/CustomButton";
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

export default function SettingsHomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const navigation = useNavigation();

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
      description: verified
        ? "Verified account"
        : "Verify your identity to complete bookings",
      route: "/home/settings/verification",
    },
    {
      title: "Account & profile",
      description: "Name, email, password, account controls",
      route: "/home/settings/account",
    },
    {
      title: "Ride preferences",
      description: "Default ride type, quiet rides",
      route: "/home/settings/ride",
    },
  ];

  const secondaryItems = [
    {
      title: "Notifications",
      description: "Ride updates, promos, push alerts",
      route: "/home/settings/notifications",
    },
    {
      title: "Accessibility & appearance",
      description: "Text size, map contrast, visual comfort",
      route: "/home/settings/accessibility",
    },
  ];

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
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
            borderRadius: 20,
            backgroundColor: Colors[colorScheme ?? "light"].bgDark,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesomeIcon
            icon={faBars}
            size={18}
            color={Colors[colorScheme ?? "light"].text}
          />
        </TouchableOpacity>
        <Text
          style={{
            ...defaultStyles.title,
            marginLeft: 12,
          }}
        >
          Settings
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {user && (
            <View
              style={{
                marginBottom: 24,
                borderRadius: 16,
                backgroundColor: colors.bg,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 14,
                  color: colors.textMuted,
                  marginBottom: 8,
                }}
              >
                Profile
              </Text>

              {loadingQuick || !settings || !profileMeta ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 4,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 13,
                      color: colors.textMuted,
                      marginLeft: 8,
                    }}
                  >
                    Loading your profile...
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: "Outfit_500Medium",
                      fontSize: 12,
                      color: colors.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Name
                  </Text>
                  <View
                    style={{
                      borderRadius: 12,
                      backgroundColor: colors.bgDark,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 8,
                    }}
                  >
                    <TextInput
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Your name"
                      placeholderTextColor={colors.textDull}
                      style={{
                        fontFamily: "Outfit_400Regular",
                        fontSize: 16,
                        color: colors.text,
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.bgDark,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCar}
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={{
                          marginLeft: 6,
                          fontFamily: "Outfit_400Regular",
                          fontSize: 13,
                          color: colors.text,
                        }}
                      >
                        {profileMeta.rides_taken} rides
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.bgDark,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faStar}
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={{
                          marginLeft: 6,
                          fontFamily: "Outfit_400Regular",
                          fontSize: 13,
                          color: colors.text,
                        }}
                      >
                        {profileMeta.rating.toFixed(1)} rating
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push("/home/settings/verification")}
                    style={{
                      marginTop: 4,
                      borderRadius: 12,
                      backgroundColor: colors.bgDark,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text
                        style={{
                          fontFamily: "Outfit_500Medium",
                          fontSize: 13,
                          color: colors.text,
                        }}
                      >
                        Identity verification
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Outfit_400Regular",
                          fontSize: 12,
                          color: colors.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {loadingVerification
                          ? "Checking verification status..."
                          : verified
                          ? "Verified"
                          : "Not verified"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "Outfit_500Medium",
                        fontSize: 18,
                        color: colors.textMuted,
                      }}
                    >
                      ›
                    </Text>
                  </TouchableOpacity>

                  {hasUnsavedChanges && (
                    <View style={{ height: 8 }} />
                  )}

                  <Text
                    style={{
                      fontFamily: "Outfit_500Medium",
                      fontSize: 12,
                      color: colors.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Quick settings
                  </Text>

                  <View style={{ marginTop: 2 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 6,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text
                          style={{
                            fontFamily: "Outfit_400Regular",
                            fontSize: 14,
                            color: colors.text,
                          }}
                        >
                          Ride updates
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Outfit_400Regular",
                            fontSize: 12,
                            color: colors.textMuted,
                            marginTop: 2,
                          }}
                        >
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
                        trackColor={{
                          false: colors.bg,
                          true: colors.primary,
                        }}
                        thumbColor={colors.bgDark}
                      />
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: 6,
                        marginTop: 4,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text
                          style={{
                            fontFamily: "Outfit_400Regular",
                            fontSize: 14,
                            color: colors.text,
                          }}
                        >
                          Quiet rides
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Outfit_400Regular",
                            fontSize: 12,
                            color: colors.textMuted,
                            marginTop: 2,
                          }}
                        >
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
                        trackColor={{
                          false: colors.bg,
                          true: colors.primary,
                        }}
                        thumbColor={colors.bgDark}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

        <View style={{ marginBottom: 8 }}>
          {primaryItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: colors.bg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={{
                    fontFamily: "Outfit_600SemiBold",
                    fontSize: 16,
                    color: colors.text,
                    marginBottom: 2,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 13,
                    color: colors.textMuted,
                  }}
                >
                  {item.description}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 18,
                  color: colors.textMuted,
                }}
              >
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={{
            height: 16,
          }}
        />

        <View
          style={{
            paddingHorizontal: 16,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Outfit_500Medium",
              fontSize: 12,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              color: colors.textMuted,
            }}
          >
            More
          </Text>
        </View>

        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: colors.bg,
          }}
        >
          {secondaryItems.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderTopWidth: index === 0 ? 0 : 1,
                borderColor: colors.bgDark,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 15,
                    color: colors.text,
                    marginBottom: 2,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 13,
                    color: colors.textMuted,
                  }}
                >
                  {item.description}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 18,
                  color: colors.textMuted,
                }}
              >
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Favourites section */}
        {user && (
          <View
            style={{
              marginTop: 24,
              marginHorizontal: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "Outfit_500Medium",
                fontSize: 12,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              Favourites
            </Text>
            <View
              style={{
                borderRadius: 16,
                backgroundColor: colors.bg,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              {loadingFavourites ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 4,
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 13,
                      color: colors.textMuted,
                      marginLeft: 8,
                    }}
                  >
                    Loading favourites...
                  </Text>
                </View>
              ) : favourites.length === 0 ? (
                <Text
                  style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 13,
                    color: colors.textMuted,
                    paddingVertical: 4,
                  }}
                >
                  You haven’t saved any favourite locations yet.
                </Text>
              ) : (
                favourites.map((fav, index) => (
                  <View
                    key={`${fav.name}-${fav.full_address}-${index}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderColor: colors.bgDark,
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text
                        style={{
                          fontFamily: "Outfit_500Medium",
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {fav.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: "Outfit_400Regular",
                          fontSize: 12,
                          color: colors.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {fav.full_address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveFavourite(fav)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.bgDark,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Outfit_500Medium",
                          fontSize: 12,
                          color: colors.text,
                        }}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
        </ScrollView>
      </View>
      {hasUnsavedChanges && (
        <View
          style={{
            position: "absolute",
            right: 16,
            bottom: 24,
          }}
        >
          <Btn
            text={savingAll ? "Saving..." : "Save changes"}
            onPress={handleSaveAll}
            disabled={savingAll}
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

