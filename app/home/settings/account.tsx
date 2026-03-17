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

export default function AccountSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const navigation = useNavigation();

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

  if (loading || !settings || !profileMeta) {
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
            Loading your account settings...
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
            Account & profile
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                ...defaultStyles.subtitle,
                marginBottom: 8,
                color: colors.textMuted,
              }}
            >
              Security & sign-in
            </Text>

            <Text
              style={{
                fontFamily: "Outfit_500Medium",
                fontSize: 12,
                color: colors.textMuted,
                marginBottom: 4,
              }}
            >
              Email
            </Text>
            <View
              style={{
                borderRadius: 12,
                backgroundColor: colors.bg,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {email || "No email linked"}
              </Text>
            </View>

            <Text
              style={{
                fontFamily: "Outfit_500Medium",
                fontSize: 12,
                color: colors.textMuted,
                marginBottom: 4,
              }}
            >
              Change email
            </Text>
            <View
              style={{
                borderRadius: 12,
                backgroundColor: colors.bg,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 8,
              }}
            >
              <TextInput
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="New email"
                placeholderTextColor={colors.textDull}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 16,
                  color: colors.text,
                }}
              />
            </View>

            <Text
              style={{
                fontFamily: "Outfit_500Medium",
                fontSize: 12,
                color: colors.textMuted,
                marginBottom: 4,
              }}
            >
              Change password
            </Text>
            <View
              style={{
                borderRadius: 12,
                backgroundColor: colors.bg,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 8,
              }}
            >
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={colors.textDull}
                secureTextEntry
                style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 16,
                  color: colors.text,
                }}
              />
            </View>

            <Btn
              text="Sign out"
              onPress={handleSignOut}
              styleBtn={{
                borderRadius: 999,
                backgroundColor: colors.bg,
                marginBottom: 12,
              }}
              styleTxt={{
                color: colors.text,
              }}
            />
            <Btn
              text="Delete account"
              onPress={handleDeleteAccount}
              styleBtn={{
                borderRadius: 999,
                backgroundColor: "#b00020",
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isDirtyAccount && (
        <View
          style={{
            position: "absolute",
            right: 16,
            bottom: 24,
          }}
        >
          <Btn
            text={updatingAuth ? "Saving..." : "Save changes"}
            onPress={handleSaveAccount}
            disabled={!!updatingAuth}
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

