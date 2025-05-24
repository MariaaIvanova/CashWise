module.exports = {
  expo: {
    name: 'FinanceApp',
    slug: 'financeapp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mariaivanova.financeapp'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.mariaivanova.financeapp',
      versionCode: 1
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    },
    plugins: [
      'expo-router'
    ],
    scheme: 'financeapp',
    runtimeVersion: {
      policy: "sdkVersion"
    },
    updates: {
      url: "https://u.expo.dev/21115eda-e4e5-4be8-89d3-f5f9c1ed9c0f"
    }
  }
}; 