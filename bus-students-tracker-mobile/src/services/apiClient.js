// FILE: src/services/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queuePendingOperation } from './offlineStorage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://10.0.2.2:5000/api'; // Standard Android emulator localhost; replace with production endpoint

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Token & check connectivity
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiry & Offline Fallbacks
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if network failure occurred for mutative requests
    const netState = await NetInfo.fetch();
    if (!netState.isConnected && originalRequest && originalRequest.method !== 'get') {
      console.warn('Network offline: queuing request for background sync', originalRequest.url);
      await queuePendingOperation({
        url: originalRequest.url,
        method: originalRequest.method,
        data: originalRequest.data,
        timestamp: new Date().toISOString(),
      });
      return Promise.resolve({
        data: { success: true, queuedOffline: true, message: 'Saved offline, will sync when reconnected' },
      });
    }

    if (error.response && error.response.status === 401) {
      // Token expired - handle session invalidation or refresh
      await AsyncStorage.multiRemove(['auth:token', 'auth:user']);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
