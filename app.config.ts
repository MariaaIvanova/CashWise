import { ExpoConfig, ConfigContext } from 'expo/config';

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
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2anJvbHl0ZWFiZWd1a2xkaGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzQyNDksImV4cCI6MjA2MzU1MDI0OX0.3ChoUYbvY1LqWHhbdRc7QYPE6GYRh29mm-SSYAB6QnE",
    emailjsServiceId: "service_uj9gkfn",
    emailjsTemplateId: "template_e1wz8li",
    emailjsPublicKey: "5OXOW5LU9LdANi6VX",
    eas: {
      projectId: "21115eda-e4e5-4be8-89d3-f5f9c1ed9c0f"
    }
  }
}); 