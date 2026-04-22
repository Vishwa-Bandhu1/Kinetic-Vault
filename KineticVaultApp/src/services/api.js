import axios from 'axios';
import {NativeModules, Platform} from 'react-native';

// For physical devices: use `adb reverse tcp:8080 tcp:8080` so localhost works.
// For emulators: use 10.0.2.2 (Android emulator's alias for the host machine).
// Detect environment: Metro bundler on physical USB devices uses the PC's LAN IP,
// while emulators use 10.0.2.2 for the bundler.
const bundlerUrl = NativeModules.SourceCode?.scriptURL;
const bundlerHostMatch = bundlerUrl?.match(/^https?:\/\/([^:/]+)(?::\d+)?/);
const bundlerHost = bundlerHostMatch?.[1];

const isEmulator =
  bundlerHost && ['10.0.2.2', '10.0.3.2'].includes(bundlerHost);

// On a physical device with ADB reverse, localhost on the device maps to the PC.
// On an emulator, 10.0.2.2 maps to the host machine's localhost.
const HOST = isEmulator ? '10.0.2.2' : 'localhost';

const BASE_URL = `http://${HOST}:8080/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

console.log('[API] Using backend host:', HOST, 'baseURL:', BASE_URL);

// Request interceptor for debugging logs
api.interceptors.request.use(
  config => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for error handling logs
api.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.config.url} => Status:`, response.status);
    return response;
  },
  error => {
    if (error.response) {
      console.error('[API Error - Response Data]', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[API Error - No Response Received] Ensure Spring Boot is running and bound to 0.0.0.0', error.message);
    } else {
      console.error('[API Error - Setup Message]', error.message);
    }
    return Promise.reject(error);
  },
);

/**
 * Analyze a text message for threats.
 */
export const analyzeMessage = async message => {
  const response = await api.post('/analyze', {message});
  return response.data;
};

/**
 * Analyze an image (OCR + threat detection).
 */
export const analyzeImage = async imageFile => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageFile.uri,
    type: imageFile.type || 'image/jpeg',
    name: imageFile.fileName || 'image.jpg',
  });

  const response = await api.post('/analyze-image', formData, {
    headers: {
      Accept: 'application/json',
      // Content-Type MUST NOT be manually set to allow React Native attaching boundary natively
    },
    timeout: 60000, // OCR requests generally take longer, keep this increased
  });
  return response.data;
};

/**
 * Generate a report for a given message ID.
 */
export const generateReport = async messageId => {
  const response = await api.post('/report', {messageId});
  return response.data;
};

/**
 * Get scan history.
 */
export const getHistory = async () => {
  const response = await api.get('/history');
  return response.data;
};

/**
 * Get PDF report URL for a message.
 */
export const getPdfReportUrl = messageId => {
  return `${BASE_URL}/report/pdf/${messageId}`;
};

export default api;
