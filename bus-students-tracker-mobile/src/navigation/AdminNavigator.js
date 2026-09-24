// FILE: src/navigation/AdminNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import FleetOverviewScreen from '../screens/admin/FleetOverviewScreen';
import AlertManagementScreen from '../screens/admin/AlertManagementScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
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
        name="FleetOverview"
        component={FleetOverviewScreen}
        options={{
          tabBarLabel: 'Fleet Radar',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>🛰️</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AlertManagement"
        component={AlertManagementScreen}
        options={{
          tabBarLabel: 'Dispatch & SOS',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>🚨</Text>
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
