import { ExpoConfig, ConfigContext } from "expo/config";

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string) => {
  return process.env[key] || fallback;
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FinanceApp",
  slug: "FinanceApp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mariaivanova.financeapp",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.mariaivanova.financeapp",
    versionCode: 1,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    output: "static",
    build: {
      babel: {
        include: ["@expo/vector-icons"],
      },
    },
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
    "expo-router",
  ],
  scheme: "financeapp",
  extra: {
    // These values will be available in your app through Constants.expoConfig.extra
    emailjsServiceId: getEnvVar(
      "EXPO_PUBLIC_EMAILJS_SERVICE_ID",
      "service_uj9gkfn"
    ),
    emailjsTemplateId: getEnvVar(
      "EXPO_PUBLIC_EMAILJS_TEMPLATE_ID",
      "template_e1wz8li"
    ),
    emailjsPublicKey: getEnvVar(
      "EXPO_PUBLIC_EMAILJS_PUBLIC_KEY",
      "5OXOW5LU9LdANi6VX"
    ),
    supabaseUrl: getEnvVar(
      "EXPO_PUBLIC_SUPABASE_URL",
      "https://tvjrolyteabegukldhln.supabase.co"
    ),
    supabaseAnonKey: getEnvVar(
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2anJvbHl0ZWFiZWd1a2xkaGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzQyNDksImV4cCI6MjA2MzU1MDI0OX0.3ChoUYbvY1LqWHhbdRc7QYPE6GYRh29mm-SSYAB6QnE"
    ),
    eas: {
      projectId: "21115eda-e4e5-4be8-89d3-f5f9c1ed9c0f",
    },
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  updates: {
    url: "https://u.expo.dev/21115eda-e4e5-4be8-89d3-f5f9c1ed9c0f",
  },
});
