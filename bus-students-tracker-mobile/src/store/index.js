// FILE: src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import trackingReducer from './trackingSlice';
import notificationsReducer from './notificationsSlice';
import driverReducer from './driverSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tracking: trackingReducer,
    notifications: notificationsReducer,
    driver: driverReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
