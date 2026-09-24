// FILE: src/screens/driver/StopChecklistScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { toggleStudentAttendance, advanceDriverStop } from '../../store/driverSlice';
import { colors } from '../../theme/colors';

export default function StopChecklistScreen() {
  const dispatch = useDispatch();
  const driver = useSelector((state) => state.driver);
  const [activeTab, setActiveTab] = useState('ROSTER'); // 'ROSTER' | 'ALL_STOPS'

  const stops = [
    { id: 1, name: 'Metro Junction (South)', boarded: 12, status: 'COMPLETED' },
    { id: 2, name: 'Tech Park Gate #3', boarded: 14, status: 'COMPLETED' },
    { id: 3, name: 'Central City Mall', boarded: 8, status: 'COMPLETED' },
    { id: 4, name: 'Green Valley Residences', boarded: 8, status: 'COMPLETED' },
    { id: 5, name: 'Sector 62 Cross Road', boarded: 4, status: 'CURRENT' },
    { id: 6, name: 'Cyber Hub Flyover', boarded: 0, status: 'UPCOMING' },
    { id: 7, name: 'Main Campus Gate #1 (Terminus)', boarded: 0, status: 'UPCOMING' },
  ];

  const handleToggleStudent = (student) => {
    dispatch(toggleStudentAttendance(student.id));
  };

  const handleScanNfc = () => {
    Alert.alert(
      'NFC / RFID Terminal Active',
      'Hold student smart ID card or mobile boarding pass near the back of the device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SIMULATE TAP',
          onPress: () => {
            const firstWaiting = driver.studentsAtCurrentStop.find((s) => s.status !== 'BOARDED');
            if (firstWaiting) {
              dispatch(toggleStudentAttendance(firstWaiting.id));
              Alert.alert('Card Verified', `${firstWaiting.name} (${firstWaiting.roll}) marked ONBOARD.`);
            } else {
              Alert.alert('All Boarded', 'All students at this stop have already verified.');
            }
          },
        },
      ]
    );
  };

  const handleDepartStop = () => {
    Alert.alert(
      'Depart Current Stop?',
      'Ensure all doors are secured and seated passengers are accounted for before pulling out.',
      [
        { text: 'Wait', style: 'cancel' },
        {
          text: 'DEPART STOP',
          onPress: () => {
            dispatch(advanceDriverStop());
            Alert.alert('Departure Logged', 'Next stop navigation engaged. Central Dispatch updated.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PASSENGER ROSTER & STOPS</Text>
          <Text style={styles.headerSubtitle}>
            Route {driver.routeId} • Stop #{driver.currentStopIndex + 1}: Sector 62
          </Text>
        </View>
        <View style={styles.capacityBadge}>
          <Text style={styles.capacityText}>
            {driver.passengerCount}/{driver.maxCapacity} SEATS
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ROSTER' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ROSTER')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'ROSTER' && styles.tabButtonTextActive]}
          >
            CURRENT STOP ROSTER ({driver.studentsAtCurrentStop.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ALL_STOPS' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ALL_STOPS')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'ALL_STOPS' && styles.tabButtonTextActive]}
          >
            ALL ROUTE STOPS (7)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {activeTab === 'ROSTER' ? (
          <>
            {/* Quick NFC Scan Header Button */}
            <TouchableOpacity style={styles.nfcButton} onPress={handleScanNfc}>
              <Text style={styles.nfcEmoji}>📡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.nfcTitle}>TAP NFC CARD / SCAN QR</Text>
                <Text style={styles.nfcSubtitle}>Automated contactless student check-in</Text>
              </View>
              <Text style={styles.nfcPill}>SCAN</Text>
            </TouchableOpacity>

            {/* Students Attendance List */}
            <Text style={styles.sectionHeader}>STUDENT MANIFEST (STOP #5)</Text>
            {driver.studentsAtCurrentStop.map((student) => {
              const isBoarded = student.status === 'BOARDED';
              return (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentMeta}>
                      {student.roll} • {student.dept}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.statusToggle,
                      isBoarded ? styles.statusBoarded : styles.statusWaiting,
                    ]}
                    onPress={() => handleToggleStudent(student)}
                  >
                    <Text
                      style={[
                        styles.statusToggleText,
                        isBoarded ? { color: colors.dark.success } : { color: colors.dark.warning },
                      ]}
                    >
                      {isBoarded ? '✓ ONBOARD' : '⏳ WAITING'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Depart Stop Action */}
            <TouchableOpacity style={styles.departButton} onPress={handleDepartStop}>
              <Text style={styles.departText}>CONFIRM DEPARTURE & ADVANCE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* All Stops Progression */}
            <Text style={styles.sectionHeader}>ROUTE PROGRESSION TIMELINE</Text>
            {stops.map((stop, index) => {
              const isCurrent = stop.status === 'CURRENT';
              const isDone = stop.status === 'COMPLETED';

              return (
                <View key={stop.id} style={styles.stopCard}>
                  <View style={styles.stopIndexColumn}>
                    <View
                      style={[
                        styles.stopCircle,
                        isDone && styles.stopCircleDone,
                        isCurrent && styles.stopCircleCurrent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stopCircleText,
                          isCurrent && { color: '#000', fontWeight: '900' },
                        ]}
                      >
                        {isDone ? '✓' : index + 1}
                      </Text>
                    </View>
                    {index < stops.length - 1 && <View style={styles.stopLine} />}
                  </View>

                  <View style={styles.stopBody}>
                    <View style={styles.stopHeaderRow}>
                      <Text style={[styles.stopName, isCurrent && { color: colors.dark.primary }]}>
                        {stop.name}
                      </Text>
                      <View
                        style={[
                          styles.stopBadge,
                          isDone && { backgroundColor: 'rgba(16,185,129,0.15)' },
                          isCurrent && { backgroundColor: 'rgba(245,158,11,0.15)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stopBadgeText,
                            isDone && { color: colors.dark.success },
                            isCurrent && { color: colors.dark.primary },
                          ]}
                        >
                          {stop.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.stopSub}>
                      {isDone ? `${stop.boarded} students boarded` : 'Scheduled pickup point'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  capacityBadge: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dark.primary,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.primary,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.dark.primary,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.dark.primary,
  },
  nfcButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    marginBottom: 16,
  },
  nfcEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  nfcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.dark.text,
  },
  nfcSubtitle: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  nfcPill: {
    backgroundColor: colors.dark.info,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.text,
  },
  studentMeta: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBoarded: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  statusWaiting: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  departButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  departText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stopCard: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stopIndexColumn: {
    alignItems: 'center',
    marginRight: 14,
    width: 28,
  },
  stopCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopCircleDone: {
    backgroundColor: colors.dark.success,
    borderColor: colors.dark.success,
  },
  stopCircleCurrent: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  stopCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.dark.border,
    marginVertical: 4,
  },
  stopBody: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  stopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark.text,
  },
  stopBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stopBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  stopSub: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 4,
  },
});
