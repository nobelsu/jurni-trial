export default {
  expo: {
    name: "Jurni",
    slug: "jurni-temp",
    scheme: "jurni-temp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/ios_main.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.suhendra.jurni",
      userInterfaceStyle: "automatic",
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO ?? "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.suhendra.jurni",
      userInterfaceStyle: "automatic",
      googleServicesFile: process.env.GOOGLE_SERVICES ?? "./google-services.json",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Show current location on map."
        }
      ],
      "expo-router",
      "@react-native-firebase/auth",
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            forceStaticLinking: ["RNFBApp"]
          }
        }
      ],
      "@rnmapbox/maps",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FFFFFF",
          image: "./assets/icons/ios_light.png",
          dark: {
            image: "./assets/icons/ios_dark.png",
            backgroundColor: "#050708"
          },
          imageWidth: 200
        }
      ]
    ],
    extra: {
      router: {},
      eas: {
        projectId: "e6cff05c-7717-497c-a16b-e707e99e6a83"
      }
    }
  }
};