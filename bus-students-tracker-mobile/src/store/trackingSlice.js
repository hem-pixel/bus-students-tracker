// FILE: src/store/trackingSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  busId: 101,
  busNumber: 'TN-47-AA-1001',
  routeId: 'R-01',
  routeName: 'Main Campus Express',
  currentSpeed: 38,
  latitude: 10.9585,
  longitude: 78.0795,
  etaMinutes: 6,
  nextStopName: 'Hostel Junction (Stop 6)',
  status: 'ON_TIME', // 'ON_TIME' | 'DELAYED' | 'HALTED'
  driverName: 'Mr. R. Murugan',
  driverPhone: '+91 98421 88901',
  driverRating: 4.9,
  stops: [
    { id: 1, name: 'Main Campus Gate', time: '08:10 AM', completed: true },
    { id: 2, name: 'Karur Roundana', time: '08:22 AM', completed: true },
    { id: 3, name: 'Bus Stand East', time: '08:35 AM', completed: true },
    { id: 4, name: 'Gandhi Gramam', time: '08:48 AM', completed: true },
    { id: 5, name: 'Collectorate Cut', time: '08:58 AM', completed: true },
    { id: 6, name: 'Hostel Junction', time: '09:12 AM', completed: false, current: true },
    { id: 7, name: 'Science Block', time: '09:25 AM', completed: false },
  ],
  studentBoarding: {
    studentId: 'VSB-2024-4091',
    studentName: 'Sarah Jenkins',
    morningStatus: 'BOARDED', // 'WAITING' | 'BOARDED' | 'ALIGHTED'
    morningBoardedTime: '08:48 AM',
    morningBoardedStop: 'Gandhi Gramam',
    eveningStatus: 'SCHEDULED',
    pickupExpected: '04:15 PM',
  },
};

export const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    updateBusLocation: (state, action) => {
      const { lat, lng, speed, eta } = action.payload;
      state.latitude = lat;
      state.longitude = lng;
      if (speed !== undefined) state.currentSpeed = speed;
      if (eta !== undefined) state.etaMinutes = eta;
    },
    updateBoardingStatus: (state, action) => {
      state.studentBoarding = {
        ...state.studentBoarding,
        ...action.payload,
      };
    },
    advanceToNextStop: (state) => {
      const currentIndex = state.stops.findIndex(s => s.current);
      if (currentIndex !== -1 && currentIndex < state.stops.length - 1) {
        state.stops[currentIndex].completed = true;
        state.stops[currentIndex].current = false;
        state.stops[currentIndex + 1].current = true;
        state.nextStopName = `${state.stops[currentIndex + 1].name} (Stop ${currentIndex + 2})`;
        state.etaMinutes = 5;
      }
    },
  },
});

export const { updateBusLocation, updateBoardingStatus, advanceToNextStop } = trackingSlice.actions;

export default trackingSlice.reducer;
