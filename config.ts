import Constants from 'expo-constants';

// Use environment variables from app.config.ts
export const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '',
  TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '',
  PUBLIC_KEY: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '',
};

// Debug logging
console.log('Expo Config:', Constants.expoConfig?.extra);
console.log('EmailJS Config Values:', {
  serviceId: Constants.expoConfig?.extra?.emailjsServiceId,
  templateId: Constants.expoConfig?.extra?.emailjsTemplateId,
  publicKey: Constants.expoConfig?.extra?.emailjsPublicKey,
}); 