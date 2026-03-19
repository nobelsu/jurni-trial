import { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "@react-native-firebase/auth";
import { Colors } from "../../../constants/Colors";
import StyleDefault from "../../../constants/DefaultStyles";
import BackBtn from "../../../components/BackButton";
import {
  getUserVerificationStatus,
  markUserVerified,
} from "../../../lib/users";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons/faShieldHalved";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons/faCircleCheck";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";

export default function VerificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const defaultStyles = StyleDefault({ colorScheme });
  const router = useRouter();
  const isDark = colorScheme === "dark";
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

  const verifiedColor = "#10b981";
  const pendingColor = "#f59e0b";
  const statusColor = verified ? verifiedColor : pendingColor;
  const iconBgColor = verified
    ? (isDark ? "#0a2e1e" : "#d1fae5")
    : (isDark ? "#2a1f00" : "#fef3c7");

  return (
    <SafeAreaView style={defaultStyles.container}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <BackBtn onPress={() => router.back()} />
        <Text style={{ ...defaultStyles.title, marginLeft: 12 }}>
          Identity verification
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{
            fontFamily: "Outfit_400Regular",
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 12,
          }}>
            Checking verification status...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero status section */}
          <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 32 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: iconBgColor,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <FontAwesomeIcon
                icon={faShieldHalved}
                size={36}
                color={statusColor}
              />
            </View>

            <Text style={{
              fontFamily: "Outfit_600SemiBold",
              fontSize: 24,
              color: colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}>
              {verified ? "You're verified" : "Not yet verified"}
            </Text>

            <Text style={{
              fontFamily: "Outfit_400Regular",
              fontSize: 14,
              color: colors.textMuted,
              textAlign: "center",
              lineHeight: 22,
              paddingHorizontal: 24,
            }}>
              {verified
                ? "Your identity has been confirmed. You can request rides with a female driver and access all features."
                : "Verify your identity to request rides with a female driver and confirm your account."}
            </Text>
          </View>

          {/* Status card */}
          <View style={{
            borderRadius: 20,
            backgroundColor: colors.bg,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 16,
          }}>
            <Text style={{
              fontFamily: "Outfit_500Medium",
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.textMuted,
              marginBottom: 12,
            }}>
              Status
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: iconBgColor,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}>
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  size={16}
                  color={statusColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: "Outfit_600SemiBold",
                  fontSize: 15,
                  color: statusColor,
                }}>
                  {verified ? "Verified" : "Pending verification"}
                </Text>
                <Text style={{
                  fontFamily: "Outfit_400Regular",
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 2,
                }}>
                  {verified
                    ? "Identity confirmed"
                    : "Your account needs verification"}
                </Text>
              </View>
            </View>
          </View>

          {/* What verification unlocks */}
          {!verified && (
            <View style={{
              borderRadius: 20,
              backgroundColor: colors.bg,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 24,
            }}>
              <Text style={{
                fontFamily: "Outfit_500Medium",
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.textMuted,
                marginBottom: 12,
              }}>
                What you'll unlock
              </Text>
              {[
                "Request rides with a female driver",
                "Full account access",
                "Priority support",
              ].map((item, index) => (
                <View
                  key={item}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.bgDark,
                  }}
                >
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    marginRight: 12,
                  }} />
                  <Text style={{
                    fontFamily: "Outfit_400Regular",
                    fontSize: 14,
                    color: colors.text,
                  }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          {!verified && (
            <TouchableOpacity
              onPress={startKycFlow}
              disabled={starting}
              style={{
                borderRadius: 16,
                backgroundColor: colors.primary,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Text style={{
                fontFamily: "Outfit_600SemiBold",
                fontSize: 16,
                color: "#ffffff",
              }}>
                {starting ? "Starting..." : "Start verification"}
              </Text>
              {!starting && (
                <FontAwesomeIcon icon={faChevronRight} size={13} color="#ffffff" />
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
