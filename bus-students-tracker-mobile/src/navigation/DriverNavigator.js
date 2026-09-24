// FILE: src/navigation/DriverNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import RouteGuidanceScreen from '../screens/driver/RouteGuidanceScreen';
import StopChecklistScreen from '../screens/driver/StopChecklistScreen';
import VehicleStatusScreen from '../screens/driver/VehicleStatusScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function DriverNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.dark.primary,
        tabBarInactiveTintColor: colors.dark.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="RouteGuidance"
        component={RouteGuidanceScreen}
        options={{
          tabBarLabel: 'HUD Guide',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>🧭</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="StopChecklist"
        component={StopChecklistScreen}
        options={{
          tabBarLabel: 'Roster & Stops',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>📋</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="VehicleStatus"
        component={VehicleStatusScreen}
        options={{
          tabBarLabel: 'Vehicle Check',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>⚡</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.dark.surface,
    borderTopColor: colors.dark.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
});
