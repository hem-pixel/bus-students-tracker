// FILE: src/screens/admin/FleetOverviewScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';

export default function FleetOverviewScreen({ navigation }) {
  const [filter, setFilter] = useState('ALL');

  const fleet = [
    {
      id: 'BUS-14',
      number: 'Bus #14',
      route: 'South Campus Express (R-01)',
      driver: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      speed: '38 km/h',
      stop: 'Stop 5/12 (Sector 62)',
      passengers: '42 / 54',
      status: 'ON SCHEDULE',
      statusType: 'success',
      eta: 'On Time',
    },
    {
      id: 'BUS-08',
      number: 'Bus #08',
      route: 'North Campus Transit (R-02)',
      driver: 'Murugan S.',
      phone: '+91 98765 11111',
      speed: '44 km/h',
      stop: 'Stop 8/10 (Tech Ring Road)',
      passengers: '51 / 54',
      status: 'ON SCHEDULE',
      statusType: 'success',
      eta: 'On Time',
    },
    {
      id: 'BUS-22',
      number: 'Bus #22',
      route: 'West Metro Line (R-03)',
      driver: 'Anand P.',
      phone: '+91 98765 22222',
      speed: '16 km/h',
      stop: 'Stop 3/14 (Flyover Bottleneck)',
      passengers: '49 / 54',
      status: '8 MIN DELAY',
      statusType: 'warning',
      eta: '+8 mins',
    },
    {
      id: 'BUS-03',
      number: 'Bus #03',
      route: 'Central Campus Shuttle (R-04)',
      driver: 'S. Selvam',
      phone: '+91 98765 33333',
      speed: '0 km/h',
      stop: 'Stop 1/8 (Campus Depot Main)',
      passengers: '14 / 40',
      status: 'BOARDING',
      statusType: 'info',
      eta: 'Departs 08:00',
    },
  ];

  const filteredFleet = filter === 'ALL' ? fleet : fleet.filter((b) => b.statusType === filter);

  const handleCallDriver = (bus) => {
    Linking.openURL(`tel:${bus.phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Contacting Driver', `Calling ${bus.driver} on ${bus.phone}`);
    });
  };

  const handleBroadcast = (bus) => {
    Alert.alert(
      `Broadcast to ${bus.number}`,
      `Send instant voice/text dispatch bulletin to driver ${bus.driver}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND BULLETIN',
          onPress: () => Alert.alert('Sent', `Bulletin dispatched to ${bus.number} cockpit unit.`),
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
            <Text style={styles.headerTitle}>FLEET RADAR OVERVIEW</Text>
            <Text style={styles.headerSubtitle}>Real-time campus transit telemetry & telemetry mesh</Text>
          </View>
          <View style={styles.radarPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.radarText}>LIVE GPS</Text>
          </View>
        </View>

        {/* Global KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE FLEET</Text>
            <Text style={styles.kpiValue}>18</Text>
            <Text style={styles.kpiSub}>100% connected</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PUNCTUALITY</Text>
            <Text style={[styles.kpiValue, { color: colors.dark.success }]}>94.2%</Text>
            <Text style={styles.kpiSub}>On-time index</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>IN TRANSIT</Text>
            <Text style={[styles.kpiValue, { color: colors.dark.primary }]}>842</Text>
            <Text style={styles.kpiSub}>Students onboard</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'success', 'warning', 'info'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f && styles.filterChipTextActive,
                ]}
              >
                {f === 'ALL'
                  ? 'ALL BUSES'
                  : f === 'success'
                  ? 'ON TIME'
                  : f === 'warning'
                  ? 'DELAYED'
                  : 'BOARDING'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fleet Cards */}
        <Text style={styles.sectionHeader}>VEHICLE STATUS CARDS</Text>
        {filteredFleet.map((bus) => {
          const isWarning = bus.statusType === 'warning';
          const isSuccess = bus.statusType === 'success';

          return (
            <View key={bus.id} style={styles.busCard}>
              <View style={styles.busHeader}>
                <View>
                  <Text style={styles.busNumber}>{bus.number}</Text>
                  <Text style={styles.busRoute}>{bus.route}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isSuccess && { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' },
                    isWarning && { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isSuccess && { color: colors.dark.success },
                      isWarning && { color: colors.dark.warning },
                    ]}
                  >
                    {bus.status}
                  </Text>
                </View>
              </View>

              <View style={styles.telemetryGrid}>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telemetryLabel}>SPEED</Text>
                  <Text style={styles.telemetryVal}>{bus.speed}</Text>
                </View>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telemetryLabel}>OCCUPANCY</Text>
                  <Text style={styles.telemetryVal}>{bus.passengers}</Text>
                </View>
                <View style={styles.telemetryItem}>
                  <Text style={styles.telemetryLabel}>CURRENT STOP</Text>
                  <Text style={styles.telemetryVal}>{bus.stop}</Text>
                </View>
              </View>

              <View style={styles.driverRow}>
                <Text style={styles.driverName}>Driver: {bus.driver}</Text>
                <View style={styles.busActions}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleCallDriver(bus)}
                  >
                    <Text style={styles.actionIconText}>📞 CALL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: colors.dark.surfaceHighlight }]}
                    onPress={() => handleBroadcast(bus)}
                  >
                    <Text style={[styles.actionIconText, { color: colors.dark.primary }]}>
                      📢 BULLETIN
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
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
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.info,
    marginRight: 6,
  },
  radarText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.info,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.dark.text,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 9,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: '#000',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.dark.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  busCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: 14,
    marginBottom: 12,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  busNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark.text,
  },
  busRoute: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  telemetryGrid: {
    flexDirection: 'row',
    backgroundColor: colors.dark.background,
    borderRadius: 6,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  telemetryItem: {
    flex: 1,
  },
  telemetryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  telemetryVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.text,
    marginTop: 2,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: 10,
  },
  driverName: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    fontWeight: '600',
  },
  busActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    backgroundColor: colors.dark.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  actionIconText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark.text,
  },
});
