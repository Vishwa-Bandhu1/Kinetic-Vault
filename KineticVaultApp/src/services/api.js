import axios from 'axios';
import {NativeModules, Platform} from 'react-native';

// Set this to true when testing against the live Render backend.
const USE_DEPLOYED = false;
const DEPLOYED_URL = 'https://kineticvault-backend.onrender.com/api';

const getHostFromUrl = url => {
  const match = url?.match(/^https?:\/\/\[?([^:/\]]+)\]?(?::\d+)?/);
  return match?.[1];
};

const sourceCodeConstants = NativeModules.SourceCode?.getConstants?.();
const bundlerUrl =
  NativeModules.SourceCode?.scriptURL || sourceCodeConstants?.scriptURL;
const bundlerHost =
  getHostFromUrl(bundlerUrl) ||
  Platform.constants?.ServerHost?.split(':')?.[0];

const isLoopbackHost = host =>
  !host || ['localhost', '127.0.0.1', '::1'].includes(host);

const isLikelyAndroidEmulator = () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  const constants = Platform.constants || {};
  const deviceText = [
    constants.Brand,
    constants.Fingerprint,
    constants.Manufacturer,
    constants.Model,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    deviceText.includes('emulator') ||
    deviceText.includes('generic') ||
    deviceText.includes('genymotion') ||
    deviceText.includes('sdk_gphone') ||
    deviceText.includes('google_sdk')
  );
};

const getLocalHost = () => {
  if (Platform.OS === 'android') {
    if (bundlerHost === '10.0.3.2') {
      return '10.0.3.2';
    }

    if (isLoopbackHost(bundlerHost)) {
      return isLikelyAndroidEmulator() ? '10.0.2.2' : '127.0.0.1';
    }
  }

  return bundlerHost || '127.0.0.1';
};

const LOCAL_HOST = getLocalHost();
const LOCAL_URL = `http://${LOCAL_HOST}:8080/api`;

const BASE_URL = USE_DEPLOYED ? DEPLOYED_URL : LOCAL_URL;
const API_TIMEOUT_MS = 30000;
const IMAGE_TIMEOUT_MS = 70000;
const API_RETRY_ATTEMPTS = 2;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT_MS,
});

console.log(
  '[API] Using backend host:',
  USE_DEPLOYED ? 'Render (deployed)' : LOCAL_HOST,
  'baseURL:',
  BASE_URL,
);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = error => {
  const status = error?.response?.status;
  if (!status) {
    return true;
  }
  return status === 408 || status === 425 || status === 429 || status >= 500;
};

const requestWithRetry = async requestFactory => {
  let lastError;

  for (let attempt = 0; attempt <= API_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await requestFactory();
    } catch (error) {
      lastError = error;
      if (attempt === API_RETRY_ATTEMPTS || !isRetryableError(error)) {
        throw error;
      }
      await sleep(400 * (attempt + 1));
    }
  }

  throw lastError;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeThreatLevel = (level, score) => {
  if (score >= 81) {
    return 'CRITICAL';
  }
  if (score >= 61) {
    return 'HIGH';
  }
  if (score >= 41) {
    return 'MEDIUM';
  }
  if (score >= 21) {
    return 'LOW';
  }

  const normalized = String(level || '').trim().toUpperCase();
  if (['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized)) {
    return normalized;
  }
  return 'NONE';
};

const scoreFromThreatLevel = level => {
  const normalized = String(level || '').trim().toUpperCase();
  if (normalized.includes('CRITICAL')) {
    return 85;
  }
  if (normalized.includes('HIGH')) {
    return 65;
  }
  if (normalized.includes('MEDIUM') || normalized.includes('MODERATE')) {
    return 45;
  }
  if (normalized.includes('LOW')) {
    return 25;
  }
  return 0;
};

const normalizeArray = value => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const normalizeThreats = data =>
  normalizeArray(data?.threats || data?.detectedThreats || data?.categories)
    .map(item => {
      if (typeof item === 'string') {
        return item;
      }
      return item?.word || item?.name || item?.label || item?.type || '';
    })
    .filter(Boolean);

const normalizeKeywords = (data, threats, riskScore) => {
  const rawKeywords = normalizeArray(data?.keywords || data?.signals);
  const confidence = riskScore >= 81 ? 95 : riskScore >= 61 ? 88 : riskScore >= 41 ? 78 : 60;
  const keywords = rawKeywords
    .map(item => {
      if (typeof item === 'string') {
        return {word: item, confidence, type: 'threat'};
      }
      if (!item || typeof item !== 'object') {
        return null;
      }
      return {
        word: item.word || item.name || item.label || item.threat || 'Suspicious indicator',
        confidence: clamp(toNumber(item.confidence ?? item.score, confidence), 0, 100),
        type: item.type || item.category || 'threat',
      };
    })
    .filter(Boolean);

  if (keywords.length > 0) {
    return keywords;
  }

  return threats.map(threat => ({word: threat, confidence, type: 'threat'}));
};

const normalizeEntities = entities => ({
  urls: normalizeArray(entities?.urls),
  phoneNumbers: normalizeArray(entities?.phoneNumbers),
  upiIds: normalizeArray(entities?.upiIds),
});

const normalizeAnalysisResult = (data, originalMessage = '') => {
  const safeData = data && typeof data === 'object' ? data : {};
  let riskScore = clamp(
    Math.round(toNumber(safeData.riskScore ?? safeData.score ?? safeData.risk, 5)),
    0,
    100,
  );
  const rawThreatLevel =
    safeData.threatLevel || safeData.riskLevel || safeData.level || safeData.severity;
  riskScore = Math.max(riskScore, scoreFromThreatLevel(rawThreatLevel));

  const aiThreatFlag =
    typeof safeData.isThreat === 'boolean'
      ? safeData.isThreat
      : typeof safeData.threat === 'boolean'
        ? safeData.threat
        : undefined;

  if (aiThreatFlag === true && riskScore < 41) {
    riskScore = 65;
  }
  if (aiThreatFlag === false && riskScore === 0) {
    riskScore = 5;
  }

  const threatLevel = normalizeThreatLevel(
    rawThreatLevel,
    riskScore,
  );
  const threats = normalizeThreats(safeData);
  const keywords = normalizeKeywords(safeData, threats, riskScore);
  const explanation =
    safeData.explanation ||
    safeData.reason ||
    safeData.analysis ||
    (riskScore > 40
      ? 'Suspicious scam indicators were detected in this message.'
      : 'No scam indicators were detected in this message.');

  return {
    id: safeData.id,
    isThreat: riskScore > 40,
    riskScore,
    threatLevel,
    riskLevel: threatLevel,
    threats,
    keywords,
    entities: normalizeEntities(safeData.entities),
    explanation,
    reason: explanation,
    content: safeData.content || originalMessage,
    createdAt: safeData.createdAt || new Date().toISOString(),
  };
};

const URL_PATTERN =
  /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9][a-z0-9-]{1,63}(?:\.[a-z]{2,})(?:\/[^\s<>"']*)?)/gi;

const extractUrls = text => {
  const matches = String(text || '').match(URL_PATTERN) || [];
  return [...new Set(matches.map(url => url.replace(/[),.;!?]+$/, '')))];
};

const matches = (text, pattern) => pattern.test(String(text || '').toLowerCase());

const addThreat = (threats, keywords, word, confidence, type) => {
  if (!threats.includes(word)) {
    threats.push(word);
  }
  if (!keywords.some(keyword => keyword.word === word)) {
    keywords.push({word, confidence, type});
  }
};

const buildLocalTextFallback = (message, prefix) => {
  const lower = String(message || '').toLowerCase();
  const urls = extractUrls(message);
  const threats = [];
  const keywords = [];
  let score = lower.trim() ? 5 : 10;

  if (urls.length > 0) {
    score += 45;
    addThreat(threats, keywords, 'Suspicious URL', 92, 'phishing');
  }
  if (matches(lower, /\b(bank|account|debit|credit|card|upi|wallet|transaction|aadhaar|aadhar|pan|kyc)\b/)) {
    score += 18;
    addThreat(threats, keywords, 'Banking or KYC language', 88, 'financial');
  }
  if (matches(lower, /\b(otp|one time password|verification code|cvv|pin|password|login|credential)\b/)) {
    score += 25;
    addThreat(threats, keywords, 'Credential or OTP request', 94, 'credential_theft');
  }
  if (matches(lower, /\b(verify|validate|update|reactivate|confirm|unlock|blocked|suspended|frozen|locked)\b/)) {
    score += 20;
    addThreat(threats, keywords, 'Phishing action request', 88, 'phishing');
  }
  if (matches(lower, /\b(immediately|urgent|today|now|within|last chance|act fast|final notice)\b/)) {
    score += 16;
    addThreat(threats, keywords, 'Urgency tactics', 86, 'urgency');
  }
  if (matches(lower, /\b(pay now|payment due|payment failed|refund|claim|cashback|fine|fee|loan|emi|overdue)\b/)) {
    score += 16;
    addThreat(threats, keywords, 'Payment or refund lure', 82, 'financial');
  }
  if (matches(lower, /\b(lottery|winner|won|prize|reward|gift card|jackpot|selected)\b/)) {
    score += 24;
    addThreat(threats, keywords, 'Lottery or prize scam', 90, 'social_engineering');
  }
  if (matches(lower, /\b(apk|install app|download app|download now|enable unknown sources)\b/)) {
    score += 32;
    addThreat(threats, keywords, 'APK download request', 96, 'malware');
  }

  if (
    matches(lower, /\b(swiggy|zomato|delivered successfully|order has been delivered|order delivered)\b/) &&
    urls.length === 0 &&
    threats.length === 0
  ) {
    score = 5;
  }

  const riskScore = clamp(threats.length === 0 ? Math.min(score, 20) : score, 5, 100);
  const threatLevel = normalizeThreatLevel('', riskScore);
  const explanation =
    riskScore > 40
      ? `${prefix} Detected ${threats.join(', ')}.`
      : `${prefix} No phishing patterns, suspicious URLs, urgency tactics, credential theft, APK download requests, or financial fraud indicators were found.`;

  return normalizeAnalysisResult(
    {
      isThreat: riskScore > 40,
      riskScore,
      threatLevel,
      riskLevel: threatLevel,
      threats,
      keywords,
      entities: {urls, phoneNumbers: [], upiIds: []},
      explanation,
    },
    message,
  );
};

const buildImageFallback = () =>
  normalizeAnalysisResult({
    isThreat: true,
    riskScore: 45,
    threatLevel: 'MEDIUM',
    riskLevel: 'MEDIUM',
    threats: ['Image analysis unavailable'],
    keywords: [
      {word: 'Image analysis unavailable', confidence: 70, type: 'service'},
    ],
    entities: {urls: [], phoneNumbers: [], upiIds: []},
    explanation:
      'Image analysis could not complete because the backend service did not respond. Treat unknown links or payment requests in the image as suspicious and retry when the service is available.',
  });

// Request interceptor for debugging logs
api.interceptors.request.use(
  config => {
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    );
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for error handling logs
api.interceptors.response.use(
  response => {
    console.log(
      `[API Response] ${response.config.url} => Status:`,
      response.status,
    );
    return response;
  },
  error => {
    if (error.response) {
      console.error(
        '[API Error - Response Data]',
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      console.error(
        '[API Error - No Response Received]',
        `${BASE_URL} did not respond.`,
        'Ensure Spring Boot is running on port 8080.',
        Platform.OS === 'android' && LOCAL_HOST === '127.0.0.1'
          ? 'For a physical Android device, run: npm run reverse:backend or adb reverse tcp:8080 tcp:8080'
          : '',
        error.message,
      );
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
  try {
    const response = await requestWithRetry(() => api.post('/analyze', {message}));
    return normalizeAnalysisResult(response.data, message);
  } catch (error) {
    console.error('[API] Text analysis failed after retries, using local fallback:', error.message);
    return buildLocalTextFallback(
      message,
      'Backend analysis was temporarily unavailable, so Kinetic Vault used local scam detection rules.',
    );
  }
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

  try {
    const response = await requestWithRetry(() =>
      api.post('/analyze-image', formData, {
        headers: {
          Accept: 'application/json',
          // Content-Type MUST NOT be manually set to allow React Native attaching boundary natively
        },
        timeout: IMAGE_TIMEOUT_MS,
      }),
    );
    return normalizeAnalysisResult(response.data);
  } catch (error) {
    console.error('[API] Image analysis failed after retries, using safe fallback:', error.message);
    return buildImageFallback();
  }
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
