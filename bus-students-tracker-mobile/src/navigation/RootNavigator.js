// FILE: src/navigation/RootNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/auth/LoginScreen';
import ParentTabNavigator from './ParentTabNavigator';
import DriverNavigator from './DriverNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user?.role === 'DRIVER' ? (
        <Stack.Screen name="DriverApp" component={DriverNavigator} />
      ) : user?.role === 'ADMIN' ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="ParentApp" component={ParentTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
