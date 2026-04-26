import axios from 'axios';
import {NativeModules, Platform} from 'react-native';

// ── Deployed backend URL (Render) ──────────────────────────────────
// Set USE_DEPLOYED = true when testing against the live Render backend.
// Set USE_DEPLOYED = false for local development with Spring Boot.
const USE_DEPLOYED = false;
const DEPLOYED_URL = 'https://kineticvault-backend.onrender.com/api';

// ── Local backend host detection ───────────────────────────────────
// Metro bundler's script URL reveals how the device reaches the PC:
//   • Emulators  → 10.0.2.2 (Android AVD alias for host loopback)
//   • Physical   → PC's LAN IPv4 (e.g. 192.168.x.x)
const bundlerUrl = NativeModules.SourceCode?.scriptURL;
const bundlerHostMatch = bundlerUrl?.match(/^https?:\/\/([^:/]+)(?::\d+)?/);
const bundlerHost = bundlerHostMatch?.[1];

const isEmulator =
  bundlerHost && ['10.0.2.2', '10.0.3.2'].includes(bundlerHost);

// Use the bundler host as the backend host — it is the IP the device
// already uses to reach the PC, so Spring Boot (bound to 0.0.0.0)
// will be reachable on the same address.
const LOCAL_HOST = isEmulator ? '10.0.2.2' : (bundlerHost || '192.168.1.6');
const LOCAL_URL = `http://${LOCAL_HOST}:8080/api`;

const BASE_URL = USE_DEPLOYED ? DEPLOYED_URL : LOCAL_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

console.log('[API] Using backend host:', USE_DEPLOYED ? 'Render (deployed)' : LOCAL_HOST, 'baseURL:', BASE_URL);

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
