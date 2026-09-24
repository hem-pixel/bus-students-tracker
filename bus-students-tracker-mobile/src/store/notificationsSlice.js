// FILE: src/store/notificationsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    {
      id: 'notif_1',
      title: 'Sarah Boarded Bus #101',
      message: 'Student biometric verified at Gandhi Gramam (Stop 4).',
      type: 'BOARDING',
      priority: 'NORMAL',
      timestamp: '08:48 AM',
      read: false,
    },
    {
      id: 'notif_2',
      title: 'Bus #101 Approaching Stop',
      message: 'Vehicle is within 1.2 km of Hostel Junction. ETA ~5 mins.',
      type: 'PROXIMITY',
      priority: 'HIGH',
      timestamp: '09:05 AM',
      read: false,
    },
    {
      id: 'notif_3',
      title: 'Route Speed Regulation Alert',
      message: 'Traffic slowdown cleared on Karur Bypass road. Running on schedule.',
      type: 'ROUTE',
      priority: 'INFO',
      timestamp: '08:30 AM',
      read: true,
    },
  ],
  filter: 'ALL',
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
    },
    markAsRead: (state, action) => {
      const item = state.items.find(n => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => { n.read = true; });
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, setFilter } = notificationsSlice.actions;

export default notificationsSlice.reducer;
