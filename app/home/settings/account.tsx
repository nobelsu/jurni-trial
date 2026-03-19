import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {
  getAuth,
  signOut,
  updateEmail,
  updatePassword,
} from "@react-native-firebase/auth";
import {
  getUserSettings,
  type UserSettings,
  getUserProfileMeta,
  type UserProfileMeta,
} from "../../../lib/users";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons/faEnvelope";
import { faLock } from "@fortawesome/free-solid-svg-icons/faLock";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons/faRightFromBracket";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";

export default function AccountSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const navigation = useNavigation();
  const isDark = colorScheme === "dark";

  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profileMeta, setProfileMeta] = useState<UserProfileMeta | null>(null);
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [updatingAuth, setUpdatingAuth] =
    useState<false | "email" | "password">(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.allSettled([
      getUserSettings(user.uid),
      getUserProfileMeta(user.uid),
    ])
      .then((results) => {
        if (cancelled) return;
        const [settingsResult, metaResult] = results;

        if (settingsResult.status === "fulfilled") {
          setSettings(settingsResult.value);
        }
        if (metaResult.status === "fulfilled") {
          setProfileMeta(metaResult.value);
        }
      })
      .catch(() => {
        if (cancelled) return;
        Alert.alert("Error", "Failed to load your settings. Please try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  async function handleChangeEmail() {
    if (!user) return;
    const targetEmail = newEmail.trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    try {
      setUpdatingAuth("email");
      await updateEmail(user, targetEmail);
      setEmail(targetEmail);
      setNewEmail("");
      Alert.alert("Email updated", "Your email has been updated.");
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-authentication required",
          "Please log out and log in again before changing your email."
        );
      } else {
        Alert.alert("Error", "Failed to change email. Please try again.");
      }
    } finally {
      setUpdatingAuth(false);
    }
  }

  async function handleChangePassword() {
    if (!user) return;
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      Alert.alert(
        "Weak password",
        "Your new password should be at least 6 characters long."
      );
      return;
    }
    try {
      setUpdatingAuth("password");
      await updatePassword(user, trimmed);
      setNewPassword("");
      Alert.alert("Password updated", "Your password has been updated.");
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-authentication required",
          "Please log out and log in again before changing your password."
        );
      } else {
        Alert.alert("Error", "Failed to change password. Please try again.");
      }
    } finally {
      setUpdatingAuth(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/");
  }

  async function handleDeleteAccount() {
    if (!user) return;
    Alert.alert(
      "Delete account",
      "This will permanently delete your account. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await user.delete();
              router.replace("/");
            } catch (e: any) {
              const code = e?.code ?? "";
              if (code === "auth/requires-recent-login") {
                Alert.alert(
                  "Re-authentication required",
                  "Please log out and log in again before deleting your account."
                );
              } else {
                Alert.alert(
                  "Error",
                  "Failed to delete account. Please try again later."
                );
              }
            }
          },
        },
      ]
    );
  }

  const isDirtyAccount =
    (newEmail.trim() !== "" && newEmail.trim() !== (user?.email ?? "")) ||
    newPassword.trim() !== "";

  function handleDiscardAccount() {
    setNewEmail("");
    setNewPassword("");
  }

  async function handleSaveAccount() {
    if (newEmail.trim() && newEmail.trim() !== (user?.email ?? "")) {
      await handleChangeEmail();
    }
    if (newPassword.trim()) {
      await handleChangePassword();
    }
  }

  const {
    showUnsavedModal,
    handleSave: handleGuardSave,
    handleDiscard: handleGuardDiscard,
    saving: guardSaving,
    handleCancel: handleGuardCancel,
  } = useUnsavedChangesGuard(navigation as never, {
    isDirty: isDirtyAccount,
    onSave: handleSaveAccount,
    onDiscard: handleDiscardAccount,
    allowLeave: !!updatingAuth,
  });

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

  if (loading || !settings || !profileMeta) {
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
            Loading account settings...
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
        onCancel={handleGuardCancel}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <BackBtn onPress={() => router.back()} />
          <Text style={{ ...defaultStyles.title, marginLeft: 12 }}>
            Account & profile
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: isDirtyAccount ? 104 : 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Security section */}
          <View style={{ marginBottom: 20 }}>
            <Text style={sectionLabel}>Security & sign-in</Text>
            <View style={card}>
              {/* Current email (readonly) */}
              <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                  <FontAwesomeIcon icon={faEnvelope} size={11} color={colors.textMuted} />
                  <Text style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 11,
                    color: colors.textMuted,
                    marginLeft: 5,
                    letterSpacing: 0.2,
                  }}>
                    Current email
                  </Text>
                </View>
                <Text style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 16,
                  color: colors.text,
                }}>
                  {email || "No email linked"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: colors.bgDark }} />

              {/* New email */}
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                  <FontAwesomeIcon icon={faEnvelope} size={11} color={colors.textMuted} />
                  <Text style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 11,
                    color: colors.textMuted,
                    marginLeft: 5,
                    letterSpacing: 0.2,
                  }}>
                    New email
                  </Text>
                </View>
                <View style={{
                  borderBottomWidth: 1.5,
                  borderBottomColor: newEmail.trim() ? colors.primary : colors.bgLight,
                  paddingBottom: 3,
                }}>
                  <TextInput
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="Enter new email"
                    placeholderTextColor={colors.textDull}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 16,
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.bgDark }} />

              {/* New password */}
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                  <FontAwesomeIcon icon={faLock} size={11} color={colors.textMuted} />
                  <Text style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 11,
                    color: colors.textMuted,
                    marginLeft: 5,
                    letterSpacing: 0.2,
                  }}>
                    New password
                  </Text>
                </View>
                <View style={{
                  borderBottomWidth: 1.5,
                  borderBottomColor: newPassword.trim() ? colors.primary : colors.bgLight,
                  paddingBottom: 3,
                }}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.textDull}
                    secureTextEntry
                    style={{
                      fontFamily: "Outfit_400Regular",
                      fontSize: 16,
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
                <Text style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 11,
                  color: colors.textDull,
                  marginTop: 6,
                }}>
                  Minimum 6 characters
                </Text>
              </View>
            </View>
          </View>

          {/* Account controls */}
          <View style={{ marginBottom: 24 }}>
            <Text style={sectionLabel}>Account</Text>
            <View style={card}>
              {/* Sign out */}
              <TouchableOpacity
                onPress={handleSignOut}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
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
                  <FontAwesomeIcon icon={faRightFromBracket} size={16} color={colors.textMuted} />
                </View>
                <Text style={{
                  fontFamily: "Outfit_500Medium",
                  fontSize: 15,
                  color: colors.text,
                  flex: 1,
                }}>
                  Sign out
                </Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.bgDark }} />

              {/* Delete account */}
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  backgroundColor: isDark ? "#2d0808" : "#fff1f1",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 14,
                }}>
                  <FontAwesomeIcon icon={faTrash} size={15} color="#e53e3e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: "Outfit_500Medium",
                    fontSize: 15,
                    color: "#e53e3e",
                  }}>
                    Delete account
                  </Text>
                  <Text style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 12,
                    color: colors.textMuted,
                    marginTop: 1,
                  }}>
                    Permanently removes your account and data
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Bar */}
      {isDirtyAccount && (
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
            onPress={handleDiscardAccount}
            disabled={!!updatingAuth}
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
            onPress={handleSaveAccount}
            disabled={!!updatingAuth}
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
              {updatingAuth ? "Saving..." : "Save changes"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
