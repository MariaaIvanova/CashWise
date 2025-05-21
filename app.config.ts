import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FinanceApp",
  slug: "financeapp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro"
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static"
        }
      }
    ]
  ],
  extra: {
    supabaseUrl: "https://tvjrolyteabegukldhln.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2anJvbHl0ZWFiZWd1a2xkaGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDkyMTQsImV4cCI6MjA2MjI4NTIxNH0.rWSopj0XKxyMtL8ggzWvajg4ilQkFgQjNm6sfvtHork",
    emailjsServiceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
    emailjsTemplateId: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
    emailjsPublicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
    eas: {
      projectId: "21115eda-e4e5-4be8-89d3-f5f9c1ed9c0f"
    }
  }
}); 