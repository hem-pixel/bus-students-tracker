// FILE: src/store/driverSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  routeId: 'R-01',
  routeName: 'Main Campus East Express',
  currentStopIndex: 4,
  totalStops: 12,
  passengerCount: 42,
  maxCapacity: 54,
  vehicleFuelPct: 78,
  engineTemp: '89°C (Normal)',
  speedLimitKmh: 50,
  currentSpeed: 38,
  isNavigationActive: true,
  studentsAtCurrentStop: [
    { id: 'S1', roll: 'VSB-2024-4091', name: 'Sarah Jenkins', dept: 'CSE - III Yr', status: 'BOARDED' },
    { id: 'S2', roll: 'VSB-2024-4092', name: 'Karthik Raja', dept: 'ECE - II Yr', status: 'BOARDED' },
    { id: 'S3', roll: 'VSB-2024-4093', name: 'Deepa Lakshmi', dept: 'IT - IV Yr', status: 'WAITING' },
    { id: 'S4', roll: 'VSB-2024-4094', name: 'Manoj Kumar', dept: 'MECH - III Yr', status: 'ABSENT' },
  ],
};

export const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    toggleStudentAttendance: (state, action) => {
      const student = state.studentsAtCurrentStop.find(s => s.id === action.payload);
      if (student) {
        if (student.status === 'BOARDED') {
          student.status = 'WAITING';
          state.passengerCount = Math.max(0, state.passengerCount - 1);
        } else {
          student.status = 'BOARDED';
          state.passengerCount = Math.min(state.maxCapacity, state.passengerCount + 1);
        }
      }
    },
    advanceDriverStop: (state) => {
      if (state.currentStopIndex < state.totalStops - 1) {
        state.currentStopIndex += 1;
      }
    },
    reportDriverIssue: (state, action) => {
      console.log('Driver issue reported:', action.payload);
    },
  },
});

export const { toggleStudentAttendance, advanceDriverStop, reportDriverIssue } = driverSlice.actions;

export default driverSlice.reducer;
