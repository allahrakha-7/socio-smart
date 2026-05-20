import { NativeModules, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_PORT = 5000;
const FALLBACK_IP = '192.168.1.5';

export const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://sociosmart-backend.onrender.com';
  }

  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  let host = 'localhost';

  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/i);
    if (match?.[1]) host = match[1];
  }

  if (Platform.OS === 'android') {
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${FALLBACK_IP}:${API_PORT}`;
    }
    return `http://${host}:${API_PORT}`;
  }

  // iOS / Default
  const finalHost = (host === 'localhost' || host === '127.0.0.1') ? 'localhost' : host;
  return `http://${finalHost}:${API_PORT}`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const session = await AsyncStorage.getItem('@sociosmart/session_v1');
      if (session) {
        const { token } = JSON.parse(session);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.log('Axios interceptor error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
