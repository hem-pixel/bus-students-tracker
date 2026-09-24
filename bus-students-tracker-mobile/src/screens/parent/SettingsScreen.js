// FILE: src/screens/parent/SettingsScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout, setBiometricsEnabled } from '../../store/authSlice';
import { colors } from '../../theme/colors';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const biometricsEnabled = useSelector((state) => state.auth.biometricsEnabled);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState('1.0 km');
  const [darkMode, setDarkMode] = useState(true);

  const handleToggleBiometrics = (val) => {
    dispatch(setBiometricsEnabled(val));
    Alert.alert(
      'Biometric Security',
      val
        ? 'Face ID / Fingerprint enabled for fast secure authentication.'
        : 'Biometric login disabled.'
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Offline Database',
      'This will clear local telemetry and boarding logs. Unsynced transactions will be synced first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CLEAR CACHE',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Local cache purged (0 bytes).'),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out of Campus Bus Tracker?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'LOGOUT',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>APP SETTINGS</Text>
          <Text style={styles.headerSubtitle}>Hardware permissions & account preferences</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 24 }}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Rajesh Sharma'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'PARENT / GUARDIAN'}</Text>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS & ALERTS</Text>
        <View style={styles.cardGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Real-time bus arrival & boarding alerts</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              thumbColor={pushEnabled ? colors.dark.primary : '#fff'}
              trackColor={{ true: 'rgba(245,158,11,0.4)', false: '#374151' }}
            />
          </View>

          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Traffic Delay Warnings</Text>
              <Text style={styles.settingDesc}>Notify when bus is running >10 mins late</Text>
            </View>
            <Switch
              value={delayAlerts}
              onValueChange={setDelayAlerts}
              thumbColor={delayAlerts ? colors.dark.primary : '#fff'}
              trackColor={{ true: 'rgba(245,158,11,0.4)', false: '#374151' }}
            />
          </View>

          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Geofence Proximity Alert</Text>
              <Text style={styles.settingDesc}>Trigger chime when bus crosses perimeter</Text>
            </View>
            <TouchableOpacity
              style={styles.radiusPill}
              onPress={() => {
                const next = geofenceRadius === '500 m' ? '1.0 km' : geofenceRadius === '1.0 km' ? '2.0 km' : '500 m';
                setGeofenceRadius(next);
              }}
            >
              <Text style={styles.radiusText}>{geofenceRadius}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Hardware */}
        <Text style={styles.sectionHeader}>SECURITY & SENSORS</Text>
        <View style={styles.cardGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Biometric Unlock</Text>
              <Text style={styles.settingDesc}>Require Face ID / Fingerprint on cold start</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              thumbColor={biometricsEnabled ? colors.dark.primary : '#fff'}
              trackColor={{ true: 'rgba(245,158,11,0.4)', false: '#374151' }}
            />
          </View>

          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>High Contrast Dark Mode</Text>
              <Text style={styles.settingDesc}>OLED optimized institutional black UI</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              thumbColor={darkMode ? colors.dark.primary : '#fff'}
              trackColor={{ true: 'rgba(245,158,11,0.4)', false: '#374151' }}
            />
          </View>
        </View>

        {/* Offline Storage */}
        <Text style={styles.sectionHeader}>OFFLINE CACHE & STORAGE</Text>
        <View style={styles.cardGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>SQLite Telemetry Database</Text>
              <Text style={styles.settingDesc}>4.2 MB cached • 0 pending sync events</Text>
            </View>
            <TouchableOpacity style={styles.actionPill} onPress={handleClearCache}>
              <Text style={styles.actionPillText}>PURGE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Campus Support Contacts */}
        <Text style={styles.sectionHeader}>CAMPUS HELPLINE</Text>
        <View style={styles.cardGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Transport Control Room</Text>
              <Text style={styles.settingDesc}>Mon - Sat: 06:00 AM - 08:00 PM</Text>
            </View>
            <Text style={styles.phoneText}>+91 98765 43210</Text>
          </View>
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Campus Safety & Security</Text>
              <Text style={styles.settingDesc}>24x7 Emergency Incident Dispatch</Text>
            </View>
            <Text style={styles.phoneText}>+91 98765 00000</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>SIGN OUT OF ACCOUNT</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>VSB Bus Students Tracker Mobile v2.4.0</Text>
          <Text style={styles.buildText}>Phase 13 Native Engine • Build #2026.09.24</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark.text,
  },
  userPhone: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.primary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark.text,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  radiusPill: {
    backgroundColor: colors.dark.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  radiusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.primary,
  },
  actionPill: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.error,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark.primary,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: colors.dark.error,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.dark.error,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  versionText: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    fontWeight: '600',
  },
  buildText: {
    fontSize: 10,
    color: colors.dark.textTertiary,
    marginTop: 2,
  },
});
