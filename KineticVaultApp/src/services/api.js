import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your computer's local IP when testing on a physical device
const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[API Error] No response received');
    } else {
      console.error('[API Error]', error.message);
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
    name: imageFile.fileName || 'screenshot.jpg',
  });

  const response = await api.post('/analyze-image', formData, {
    headers: {'Content-Type': 'multipart/form-data'},
    timeout: 60000,
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
