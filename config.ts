import Constants from 'expo-constants';
import { EMAILJS_LOCAL_CONFIG } from './config.local';

// Debug logging
console.log('Expo Config:', Constants.expoConfig?.extra);
console.log('EmailJS Config Values:', {
  serviceId: Constants.expoConfig?.extra?.emailjsServiceId,
  templateId: Constants.expoConfig?.extra?.emailjsTemplateId,
  publicKey: Constants.expoConfig?.extra?.emailjsPublicKey,
});

// Use local config if available, otherwise try environment variables
export const EMAILJS_CONFIG = {
  SERVICE_ID: EMAILJS_LOCAL_CONFIG.SERVICE_ID || Constants.expoConfig?.extra?.emailjsServiceId || '',
  TEMPLATE_ID: EMAILJS_LOCAL_CONFIG.TEMPLATE_ID || Constants.expoConfig?.extra?.emailjsTemplateId || '',
  PUBLIC_KEY: EMAILJS_LOCAL_CONFIG.PUBLIC_KEY || Constants.expoConfig?.extra?.emailjsPublicKey || '',
}; 