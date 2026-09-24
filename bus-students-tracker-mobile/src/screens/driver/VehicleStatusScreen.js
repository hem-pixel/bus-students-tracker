// FILE: src/screens/driver/VehicleStatusScreen.js
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
import { colors } from '../../theme/colors';

export default function VehicleStatusScreen() {
  const driver = useSelector((state) => state.driver);

  const [inspections, setInspections] = useState([
    { id: 1, label: 'Dual-circuit Air Brake Pressure (>6.5 bar)', checked: true },
    { id: 2, label: 'Headlights, Indicators & Emergency Hazards', checked: true },
    { id: 3, label: 'First Aid Kit & ABC Fire Extinguisher Inspected', checked: true },
    { id: 4, label: 'Dual HD CCTV & GPS Telemetry Unit Online', checked: true },
    { id: 5, label: 'Emergency Exit Door Release & Safety Hammer', checked: true },
    { id: 6, label: 'Speed Governor Seal Intact (Max 50 km/h)', checked: true },
  ]);

  const toggleInspection = (id) => {
    setInspections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleReportDefect = () => {
    Alert.alert(
      'Report Vehicle Maintenance Defect',
      'Select issue category to dispatch to Campus Depot Maintenance Team:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Brake / Steering',
          onPress: () => Alert.alert('Defect Logged', 'Work order #WO-891 created for Depot Workshop.'),
        },
        {
          text: 'AC / Electrical',
          onPress: () => Alert.alert('Defect Logged', 'Work order #WO-892 created for Depot Workshop.'),
        },
        {
          text: 'Tyre / Suspension',
          onPress: () => Alert.alert('Defect Logged', 'Work order #WO-893 created for Depot Workshop.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>VEHICLE HEALTH & INSPECTION</Text>
            <Text style={styles.headerSubtitle}>Ashok Leyland Falcon • Bus #14 (TN-37-BY-8812)</Text>
          </View>
          <View style={styles.healthBadge}>
            <Text style={styles.healthText}>CERTIFIED</Text>
          </View>
        </View>

        {/* Telemetry Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Fuel Level */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricEmoji}>⛽</Text>
              <Text style={styles.metricLabel}>DIESEL FUEL</Text>
            </View>
            <Text style={styles.metricVal}>{driver.vehicleFuelPct}%</Text>
            <Text style={styles.metricSub}>~210 km estimated range</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${driver.vehicleFuelPct}%` }]} />
            </View>
          </View>

          {/* Engine Temperature */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricEmoji}>🌡️</Text>
              <Text style={styles.metricLabel}>COOLANT TEMP</Text>
            </View>
            <Text style={styles.metricVal}>89°C</Text>
            <Text style={[styles.metricSub, { color: colors.dark.success }]}>Normal (85-95°C)</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: '70%', backgroundColor: colors.dark.success },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {/* Tyre Pressure */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricEmoji}>🛞</Text>
              <Text style={styles.metricLabel}>TYRE PRESSURE</Text>
            </View>
            <Text style={styles.metricVal}>34 PSI</Text>
            <Text style={styles.metricSub}>Front: 34 • Rear Duals: 36</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>ALL 6 SENSORS OK</Text>
            </View>
          </View>

          {/* Battery / Alternator */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <Text style={styles.metricEmoji}>⚡</Text>
              <Text style={styles.metricLabel}>ELECTRICAL BUS</Text>
            </View>
            <Text style={styles.metricVal}>24.4 V</Text>
            <Text style={styles.metricSub}>Alternator Charging</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>HEALTHY (100%)</Text>
            </View>
          </View>
        </View>

        {/* Depot Compliance Banner */}
        <View style={styles.complianceCard}>
          <Text style={styles.complianceTitle}>CAMPUS DEPOT FITNESS PASS</Text>
          <Text style={styles.complianceMeta}>
            Fitness Certificate Valid until: 15 Dec 2026 • Pollution Check Valid (BS-VI)
          </Text>
          <Text style={styles.complianceInspector}>
            Last Inspected by: Chief Transport Inspector • Depot #2
          </Text>
        </View>

        {/* Pre-Trip Inspection Checklist */}
        <Text style={styles.sectionTitle}>DAILY PRE-TRIP CHECKLIST (DRIVER SIGN-OFF)</Text>
        <View style={styles.checklistCard}>
          {inspections.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.checkItem}
              onPress={() => toggleInspection(item.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.checked && styles.checkboxActive,
                ]}
              >
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkLabel, item.checked && styles.checkLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Report Defect Button */}
        <TouchableOpacity style={styles.defectButton} onPress={handleReportDefect}>
          <Text style={styles.defectButtonText}>⚠️ REPORT MECHANICAL DEFECT TO WORKSHOP</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: 12,
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
  healthBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  healthText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.success,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark.text,
  },
  metricSub: {
    fontSize: 10,
    color: colors.dark.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.dark.success,
  },
  complianceCard: {
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginVertical: 12,
  },
  complianceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.dark.primary,
    letterSpacing: 0.5,
  },
  complianceMeta: {
    fontSize: 11,
    color: colors.dark.text,
    marginTop: 4,
  },
  complianceInspector: {
    fontSize: 10,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.dark.textSecondary,
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  checklistCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dark.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  checkmark: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
  },
  checkLabel: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  checkLabelActive: {
    color: colors.dark.text,
    fontWeight: '600',
  },
  defectButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: colors.dark.error,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  defectButtonText: {
    color: colors.dark.error,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
