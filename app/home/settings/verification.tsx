import { useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "@react-native-firebase/auth";
import { Colors } from "../../../constants/Colors";
import StyleDefault from "../../../constants/DefaultStyles";
import Btn from "../../../components/CustomButton";
import BackBtn from "../../../components/BackButton";
import {
  getUserVerificationStatus,
  markUserVerified,
} from "../../../lib/users";

export default function VerificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const user = getAuth().currentUser;

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getUserVerificationStatus(user.uid)
      .then((isVerified) => {
        if (cancelled) return;
        setVerified(isVerified);
      })
      .catch(() => {
        if (cancelled) return;
        setVerified(false);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  async function startKycFlow() {
    if (!user?.uid) {
      Alert.alert("Sign in required", "Please sign in to verify your identity.");
      return;
    }

    // Placeholder implementation until third-party KYC is integrated.
    setStarting(true);
    try {
      await markUserVerified(user.uid);
      setVerified(true);
      Alert.alert(
        "Verification complete",
        "Your account has been marked as verified."
      );
    } catch {
      Alert.alert("Error", "Could not start verification. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <SafeAreaView style={defaultStyles.container}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <BackBtn onPress={() => router.back()} />
        <Text
          style={{
            ...defaultStyles.title,
            marginLeft: 12,
          }}
        >
          Identity verification
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              ...defaultStyles.subtitle,
              marginTop: 10,
              color: colors.textMuted,
            }}
          >
            Checking verification status...
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{
              borderRadius: 16,
              backgroundColor: colors.bg,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Outfit_500Medium",
                fontSize: 12,
                color: colors.textMuted,
                marginBottom: 6,
              }}
            >
              Status
            </Text>
            <Text
              style={{
                fontFamily: "Outfit_600SemiBold",
                fontSize: 20,
                color: verified ? colors.primary : colors.text,
                marginBottom: 8,
              }}
            >
              {verified ? "Verified" : "Not verified"}
            </Text>
            <Text
              style={{
                ...defaultStyles.subtitle,
                color: colors.textMuted,
              }}
            >
              {verified
                ? "Your identity has been verified. You can continue using ride features."
                : "Verify your identity to unlock ride confirmation. We will connect this flow to a third-party KYC provider next."}
            </Text>
          </View>

          {!verified && (
            <Btn
              text={starting ? "Starting..." : "Start verification"}
              onPress={startKycFlow}
              disabled={starting}
              styleBtn={{
                borderRadius: 999,
              }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
