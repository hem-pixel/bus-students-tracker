// FILE: src/screens/driver/RouteGuidanceScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { advanceDriverStop } from '../../store/driverSlice';
import { colors } from '../../theme/colors';

export default function RouteGuidanceScreen({ navigation }) {
  const dispatch = useDispatch();
  const driver = useSelector((state) => state.driver);

  const [currentSpeed, setCurrentSpeed] = useState(driver.currentSpeed);
  const [distanceToStop, setDistanceToStop] = useState(850); // meters

  useEffect(() => {
    const interval = setInterval(() => {
      // Minor speed fluctuation simulation
      setCurrentSpeed((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = Math.max(25, Math.min(48, prev + delta));
        return next;
      });

      setDistanceToStop((prev) => (prev > 50 ? prev - 25 : 850));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleArriveAtStop = () => {
    Alert.alert(
      'Confirm Stop Arrival',
      `Mark arrival at Stop #${driver.currentStopIndex + 1}? This will notify waiting parents and open the passenger checklist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ARRIVED',
          onPress: () => {
            dispatch(advanceDriverStop());
            Alert.alert('Stop Reached', 'Geofence triggered. Ready for passenger boarding.');
          },
        },
      ]
    );
  };

  const handleEmergencyDistress = () => {
    Alert.alert(
      'DRIVER DISTRESS SIGNAL',
      'Transmit high-priority alert to Campus Central Dispatch with vehicle telemetry and GPS coordinates?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'BROADCAST DISTRESS',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Distress Signal Transmitted',
              'Dispatch team and nearby support units have been alerted.'
            ),
        },
      ]
    );
  };

  const isOverspeeding = currentSpeed > driver.speedLimitKmh;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.routePill}>{driver.routeId} • ACTIVE GUIDANCE</Text>
            <Text style={styles.routeName}>{driver.routeName}</Text>
          </View>
          <View style={styles.stopCounter}>
            <Text style={styles.stopCounterText}>
              STOP {driver.currentStopIndex + 1} / {driver.totalStops}
            </Text>
          </View>
        </View>

        {/* Turn-by-Turn HUD Banner */}
        <View style={styles.hudCard}>
          <View style={styles.turnRow}>
            <View style={styles.turnIconBox}>
              <Text style={{ fontSize: 32 }}>↗️</Text>
            </View>
            <View style={styles.turnInfo}>
              <Text style={styles.turnDistance}>IN {distanceToStop} METERS</Text>
              <Text style={styles.turnInstruction}>
                Turn slight right onto University Blvd towards Gate #2
              </Text>
            </View>
          </View>
          <View style={styles.laneGuidance}>
            <Text style={styles.laneText}>Keep 2 center lanes for express bus transit</Text>
          </View>
        </View>

        {/* Instrument Gauges (Speed & Capacity) */}
        <View style={styles.gaugeRow}>
          {/* Speed Gauge */}
          <View style={[styles.gaugeCard, isOverspeeding && styles.gaugeAlert]}>
            <Text style={styles.gaugeLabel}>CURRENT SPEED</Text>
            <View style={styles.speedDisplay}>
              <Text style={[styles.speedNumber, isOverspeeding && { color: colors.dark.error }]}>
                {currentSpeed}
              </Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
            <View style={styles.limitPill}>
              <Text style={styles.limitText}>MAX: {driver.speedLimitKmh} KM/H</Text>
            </View>
          </View>

          {/* Passenger Capacity Gauge */}
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>ONBOARD PASSENGERS</Text>
            <View style={styles.capacityDisplay}>
              <Text style={styles.capacityNumber}>{driver.passengerCount}</Text>
              <Text style={styles.capacityMax}>/ {driver.maxCapacity}</Text>
            </View>
            <View
              style={[
                styles.capacityBarTrack,
                { width: '100%', height: 6, backgroundColor: '#374151', borderRadius: 3, marginTop: 8 },
              ]}
            >
              <View
                style={{
                  width: `${(driver.passengerCount / driver.maxCapacity) * 100}%`,
                  height: '100%',
                  backgroundColor:
                    driver.passengerCount >= driver.maxCapacity
                      ? colors.dark.error
                      : colors.dark.primary,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={styles.capacityStatus}>
              {driver.maxCapacity - driver.passengerCount} SEATS AVAILABLE
            </Text>
          </View>
        </View>

        {/* Next Scheduled Stop Information */}
        <View style={styles.nextStopCard}>
          <View style={styles.nextStopHeader}>
            <Text style={styles.nextStopLabel}>NEXT SCHEDULED STOP</Text>
            <Text style={styles.etaText}>~3 MINS</Text>
          </View>
          <Text style={styles.nextStopName}>Sector 62 Cross Road (North Gate)</Text>
          <Text style={styles.nextStopMeta}>
            4 Students Waiting to Board • 2 Students Scheduled for Dropoff
          </Text>

          <View style={styles.stopActionRow}>
            <TouchableOpacity style={styles.arriveButton} onPress={handleArriveAtStop}>
              <Text style={styles.arriveButtonText}>MARK ARRIVAL AT STOP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rosterShortcut}
              onPress={() => navigation.navigate('StopChecklist')}
            >
              <Text style={styles.rosterShortcutText}>ROSTER 📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Driver Quick Actions */}
        <Text style={styles.sectionTitle}>DISPATCH ACTIONS</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Traffic Reported', 'Slow congestion logged on University Blvd.')}
          >
            <Text style={styles.actionEmoji}>⚠️</Text>
            <Text style={styles.actionLabel}>Report Traffic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Linking.openURL('tel:9876543210').catch(() =>
                Alert.alert('Dispatch', 'Calling Central Dispatch...')
              )
            }
          >
            <Text style={styles.actionEmoji}>📞</Text>
            <Text style={styles.actionLabel}>Call Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.distressButton]}
            onPress={handleEmergencyDistress}
          >
            <Text style={styles.actionEmoji}>🚨</Text>
            <Text style={[styles.actionLabel, { color: colors.dark.error }]}>Emergency SOS</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: 12,
  },
  routePill: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.primary,
    letterSpacing: 0.5,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark.text,
    marginTop: 2,
  },
  stopCounter: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  stopCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.dark.textSecondary,
  },
  hudCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.primary,
    marginBottom: 16,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnIconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  turnInfo: {
    flex: 1,
  },
  turnDistance: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.dark.primary,
    letterSpacing: 0.5,
  },
  turnInstruction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.text,
    marginTop: 2,
    lineHeight: 20,
  },
  laneGuidance: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  laneText: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    fontWeight: '600',
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
  },
  gaugeAlert: {
    borderColor: colors.dark.error,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  speedDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  speedNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.dark.text,
  },
  speedUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginLeft: 4,
  },
  limitPill: {
    backgroundColor: colors.dark.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  limitText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.dark.textSecondary,
  },
  capacityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  capacityNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark.text,
  },
  capacityMax: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginLeft: 4,
  },
  capacityStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginTop: 6,
  },
  nextStopCard: {
    backgroundColor: colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: 20,
  },
  nextStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nextStopLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.primary,
    letterSpacing: 0.5,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.dark.success,
  },
  nextStopName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: 4,
  },
  nextStopMeta: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  stopActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  arriveButton: {
    flex: 1,
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  arriveButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rosterShortcut: {
    backgroundColor: colors.dark.surfaceHighlight,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  rosterShortcutText: {
    color: colors.dark.text,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.dark.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
  },
  distressButton: {
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark.text,
    textAlign: 'center',
  },
});
