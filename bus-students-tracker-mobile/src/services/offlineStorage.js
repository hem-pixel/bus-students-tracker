// FILE: src/services/offlineStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'cache:pending_operations';
const NOTIFICATIONS_CACHE_KEY = 'cache:notifications';
const TRIPS_CACHE_KEY = 'cache:trips';

export const initDatabase = async () => {
  // Ensure base queue structures exist
  const existingQueue = await AsyncStorage.getItem(QUEUE_KEY);
  if (!existingQueue) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  }
  return true;
};

export const queuePendingOperation = async (operation) => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    const item = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...operation,
    };
    queue.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return item;
  } catch (err) {
    console.error('Failed to queue offline operation:', err);
  }
};

export const getPendingOperations = async () => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

export const clearPendingOperation = async (opId) => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    const filtered = queue.filter(op => op.id !== opId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove pending operation:', err);
  }
};

export const cacheNotifications = async (notifications) => {
  await AsyncStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(notifications));
};

export const getCachedNotifications = async () => {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const cacheTrips = async (trips) => {
  await AsyncStorage.setItem(TRIPS_CACHE_KEY, JSON.stringify(trips));
};

export const getCachedTrips = async () => {
  const raw = await AsyncStorage.getItem(TRIPS_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
};
