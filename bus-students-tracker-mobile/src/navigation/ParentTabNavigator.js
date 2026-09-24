// FILE: src/navigation/ParentTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text } from 'react-native';
import LiveMapScreen from '../screens/parent/LiveMapScreen';
import BoardingStatusScreen from '../screens/parent/BoardingStatusScreen';
import NotificationsScreen from '../screens/parent/NotificationsScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';
import { colors } from '../theme/colors';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();

export default function ParentTabNavigator() {
  const unreadCount = useSelector(
    (state) => state.notifications.items.filter((n) => !n.read).length
  );

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
        name="LiveMap"
        component={LiveMapScreen}
        options={{
          tabBarLabel: 'Live Map',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>🗺️</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="BoardingStatus"
        component={BoardingStatusScreen}
        options={{
          tabBarLabel: 'Boarding',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>🚌</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>🔔</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Text style={{ fontSize: 18, color }}>⚙️</Text>
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
  badge: {
    backgroundColor: colors.dark.error,
    fontSize: 10,
    minWidth: 16,
    height: 16,
  },
});
