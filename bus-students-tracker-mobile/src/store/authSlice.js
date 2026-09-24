// FILE: src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null, // { id, name, email, role: 'PARENT' | 'DRIVER' | 'ADMIN', studentName }
  token: null,
  isAuthenticated: false,
  isLoading: false,
  biometricsEnabled: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setBiometricsEnabled: (state, action) => {
      state.biometricsEnabled = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, logoutUser, setBiometricsEnabled, setLoading } = authSlice.actions;

export const performLogout = () => async (dispatch) => {
  await AsyncStorage.multiRemove(['auth:token', 'auth:user']);
  dispatch(logoutUser());
};

export default authSlice.reducer;
