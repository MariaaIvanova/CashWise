import Constants from 'expo-constants';

// Get configuration from Expo Constants
const extra = Constants.expoConfig?.extra || {};

export const EMAILJS_CONFIG = {
  SERVICE_ID: extra.emailjsServiceId || '',
  TEMPLATE_ID: extra.emailjsTemplateId || '',
  PUBLIC_KEY: extra.emailjsPublicKey || '',
};

// Debug logging
if (__DEV__) {
  console.log('EmailJS Config Values:', {
    serviceId: EMAILJS_CONFIG.SERVICE_ID,
    templateId: EMAILJS_CONFIG.TEMPLATE_ID,
    publicKey: EMAILJS_CONFIG.PUBLIC_KEY ? '***' : '', // Hide the actual key in logs
  });
} 