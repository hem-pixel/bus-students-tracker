// FILE: src/screens/admin/AlertManagementScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { colors } from '../../theme/colors';

export default function AlertManagementScreen({ navigation }) {
  const [filter, setFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-101',
      type: 'EMERGENCY',
      severity: 'CRITICAL',
      title: 'Parent Distress SOS Triggered',
      bus: 'Bus #14',
      route: 'South Campus Express (R-01)',
      student: 'Arpit Sharma (ID: STU-8821)',
      parent: 'Sunita Sharma (+91 98765 43210)',
      time: '2 mins ago',
      timestamp: '07:54 AM',
      location: 'Sector 62 Crossway, Near Metro Pillar 142',
      driver: 'Rajesh Kumar (+91 98765 00001)',
      description: 'Parent flagged SOS: Student marked absent on morning boarding scan. Requesting verification with bus coordinator.',
      status: 'ACTIVE',
      color: colors.dark.error,
    },
    {
      id: 'ALT-102',
      type: 'GEOFENCE',
      severity: 'HIGH',
      title: 'Safety Geofence Speed Breach',
      bus: 'Bus #22',
      route: 'West Metro Line (R-03)',
      time: '6 mins ago',
      timestamp: '07:50 AM',
      location: 'Flyover Outer Ring Road (Km 14.2)',
      driver: 'Anand P. (+91 98765 00002)',
      description: 'Vehicle exceeded safety speed limit (68 km/h in a 40 km/h restricted school buffer zone). Alert automatically pushed to vehicle HUD.',
      status: 'ACTIVE',
      color: colors.dark.warning,
    },
    {
      id: 'ALT-103',
      type: 'GEOFENCE',
      severity: 'HIGH',
      title: 'Unscheduled Stop Departure',
      bus: 'Bus #08',
      route: 'North Campus Transit (R-02)',
      student: 'Pooja Verma (ID: STU-4412)',
      time: '14 mins ago',
      timestamp: '07:42 AM',
      location: 'Ring Road Bypass Junction',
      driver: 'Murugan S. (+91 98765 00003)',
      description: 'Passenger NFC card scanned out at non-designated stop #04 instead of registered Stop #08. Parent notified via instant push.',
      status: 'ACKNOWLEDGED',
      color: colors.dark.warning,
    },
    {
      id: 'ALT-104',
      type: 'DELAY',
      severity: 'MEDIUM',
      title: 'Severe Route Delay (> 15 Mins)',
      bus: 'Bus #22',
      route: 'West Metro Line (R-03)',
      time: '22 mins ago',
      timestamp: '07:34 AM',
      location: 'Metro Pillar 88 Waterlogging Zone',
      driver: 'Anand P. (+91 98765 00002)',
      description: 'Traffic congestion due to road construction on MG Road. Estimated delay on remaining 6 stops is +18 minutes.',
      status: 'ACKNOWLEDGED',
      color: '#EAB308',
    },
    {
      id: 'ALT-105',
      type: 'HARDWARE',
      severity: 'LOW',
      title: 'Engine Coolant High Temp Warning',
      bus: 'Bus #14',
      route: 'South Campus Express (R-01)',
      time: '35 mins ago',
      timestamp: '07:21 AM',
      location: 'Sector 58 Industrial Avenue',
      driver: 'Rajesh Kumar (+91 98765 00001)',
      description: 'Telemetry sensor OBD-II reported engine temperature spike to 98°C. Maintenance team notified for post-trip service inspection.',
      status: 'RESOLVED',
      color: colors.dark.info,
    },
  ]);

  const filteredAlerts =
    filter === 'ALL'
      ? alerts
      : alerts.filter((a) => a.type === filter);

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  const handleAcknowledge = (alertItem) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertItem.id ? { ...a, status: 'ACKNOWLEDGED' } : a
      )
    );
    Alert.alert(
      'Alert Acknowledged',
      `Dispatch is actively monitoring ${alertItem.id} (${alertItem.title}). Status updated to ACKNOWLEDGED.`
    );
  };

  const openResolveModal = (alertItem) => {
    setSelectedAlert(alertItem);
    setResolutionNote(`Incident investigated with driver. Verified situation is under control and student is accounted for.`);
    setResolveModalVisible(true);
  };

  const handleConfirmResolve = () => {
    if (!selectedAlert) return;
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === selectedAlert.id ? { ...a, status: 'RESOLVED' } : a
      )
    );
    setResolveModalVisible(false);
    Alert.alert(
      'Incident Resolved',
      `Incident ${selectedAlert.id} has been formally logged and marked as RESOLVED in the central dispatch registry.`
    );
  };

  const handleDispatchEscort = (alertItem) => {
    Alert.alert(
      'Dispatch Security Escort',
      `Deploy nearest Campus Rapid Response Patrol Unit to ${alertItem.location}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DISPATCH UNIT NOW',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Patrol Unit Dispatched',
              `Unit #3 (Sub-Inspector Ramanathan) dispatched with GPS telemetry tracking to ${alertItem.location}. Estimated Arrival: 6 mins.`
            );
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber, name) => {
    const rawNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${rawNumber}`).catch(() => {
      Alert.alert('Phone Call', `Calling ${name} at ${phoneNumber}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>COMMAND DISPATCH CENTER</Text>
            <Text style={styles.headerTitle}>Emergency & SOS Ops</Text>
          </View>
          <View style={styles.badgeWrap}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>LIVE RADAR</Text>
          </View>
        </View>

        {/* Critical Alert Banner if Critical exists */}
        {criticalCount > 0 && (
          <View style={styles.criticalBanner}>
            <View style={styles.criticalBannerLeft}>
              <Text style={styles.criticalIcon}>🚨</Text>
              <View>
                <Text style={styles.criticalTitle}>CRITICAL SOS SIGNAL DETECTED</Text>
                <Text style={styles.criticalSubtitle}>
                  {criticalCount} active emergency distress event requires immediate response
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.criticalBannerBtn}
              onPress={() => setFilter('EMERGENCY')}
            >
              <Text style={styles.criticalBannerBtnText}>REVIEW</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.dark.error, borderLeftWidth: 3 }]}>
            <Text style={styles.statLabel}>ACTIVE SOS</Text>
            <Text style={[styles.statValue, { color: colors.dark.error }]}>{activeCount}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.dark.warning, borderLeftWidth: 3 }]}>
            <Text style={styles.statLabel}>IN PROGRESS</Text>
            <Text style={[styles.statValue, { color: colors.dark.warning }]}>
              {alerts.filter((a) => a.status === 'ACKNOWLEDGED').length}
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.dark.success, borderLeftWidth: 3 }]}>
            <Text style={styles.statLabel}>RESOLVED</Text>
            <Text style={[styles.statValue, { color: colors.dark.success }]}>
              {alerts.filter((a) => a.status === 'RESOLVED').length}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['ALL', 'EMERGENCY', 'GEOFENCE', 'DELAY', 'HARDWARE'].map((item) => {
            const isActive = filter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Alert List */}
        <Text style={styles.sectionTitle}>
          INCIDENTS ({filteredAlerts.length})
        </Text>

        {filteredAlerts.map((item) => {
          const isResolved = item.status === 'RESOLVED';
          const isAck = item.status === 'ACKNOWLEDGED';

          return (
            <View
              key={item.id}
              style={[
                styles.alertCard,
                { borderLeftColor: item.color, borderLeftWidth: 4 },
                isResolved && { opacity: 0.65 },
              ]}
            >
              {/* Top Row: Severity + Status + Time */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: `${item.color}22`, borderColor: `${item.color}55` },
                    ]}
                  >
                    <Text style={[styles.severityBadgeText, { color: item.color }]}>
                      {item.severity}
                    </Text>
                  </View>
                  <Text style={styles.alertId}>{item.id}</Text>
                </View>

                <View style={styles.cardHeaderRight}>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'ACTIVE' && { backgroundColor: `${colors.dark.error}22` },
                      item.status === 'ACKNOWLEDGED' && { backgroundColor: `${colors.dark.warning}22` },
                      item.status === 'RESOLVED' && { backgroundColor: `${colors.dark.success}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.status === 'ACTIVE' && { color: colors.dark.error },
                        item.status === 'ACKNOWLEDGED' && { color: colors.dark.warning },
                        item.status === 'RESOLVED' && { color: colors.dark.success },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>{item.time}</Text>
                </View>
              </View>

              {/* Title & Route */}
              <Text style={styles.alertTitle}>{item.title}</Text>
              <View style={styles.busInfoRow}>
                <Text style={styles.busTag}>{item.bus}</Text>
                <Text style={styles.routeText}>{item.route}</Text>
              </View>

              {/* Description */}
              <Text style={styles.alertDesc}>{item.description}</Text>

              {/* Location */}
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>

              {/* Student info if present */}
              {item.student && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>👤</Text>
                  <Text style={styles.detailValue}>
                    {item.student}
                  </Text>
                </View>
              )}

              {/* Driver info */}
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🚍</Text>
                <Text style={styles.detailValue}>
                  {item.driver}
                </Text>
              </View>

              {/* Quick Actions */}
              <View style={styles.cardActions}>
                {item.status === 'ACTIVE' && (
                  <TouchableOpacity
                    style={styles.ackButton}
                    onPress={() => handleAcknowledge(item)}
                  >
                    <Text style={styles.ackButtonText}>ACKNOWLEDGE</Text>
                  </TouchableOpacity>
                )}

                {item.type === 'EMERGENCY' && item.status !== 'RESOLVED' && (
                  <TouchableOpacity
                    style={styles.dispatchButton}
                    onPress={() => handleDispatchEscort(item)}
                  >
                    <Text style={styles.dispatchButtonText}>DISPATCH ESCORT</Text>
                  </TouchableOpacity>
                )}

                {item.status !== 'RESOLVED' ? (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => openResolveModal(item)}
                  >
                    <Text style={styles.resolveButtonText}>RESOLVE</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.resolvedLabel}>
                    <Text style={styles.resolvedLabelText}>✓ Incident Closed</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => handleCall(item.driver, 'Driver')}
                >
                  <Text style={{ fontSize: 14 }}>📞</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Global Dispatch Broadcast Bar */}
        <TouchableOpacity
          style={styles.broadcastBanner}
          onPress={() => {
            Alert.alert(
              'Fleet Broadcast Alert',
              'Send high-priority audio chime and broadcast dispatch push notification to ALL 4 active bus terminals?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'BROADCAST TO FLEET',
                  onPress: () =>
                    Alert.alert(
                      'Broadcast Transmitted',
                      'High-priority audio chime sent to 4 active driver tablets and all registered parents.'
                    ),
                },
              ]
            );
          }}
        >
          <Text style={styles.broadcastIcon}>📢</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.broadcastTitle}>BROADCAST FLEET-WIDE DISPATCH</Text>
            <Text style={styles.broadcastSub}>Issue urgent traffic advisory or weather warning</Text>
          </View>
          <Text style={styles.broadcastArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Incident Resolution Modal */}
      <Modal
        visible={resolveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resolve Incident</Text>
              <TouchableOpacity onPress={() => setResolveModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <View style={styles.modalAlertSnippet}>
                <Text style={styles.modalAlertId}>{selectedAlert.id} - {selectedAlert.title}</Text>
                <Text style={styles.modalAlertBus}>{selectedAlert.bus} • {selectedAlert.location}</Text>
              </View>
            )}

            <Text style={styles.modalInputLabel}>Resolution Notes & Actions Taken *</Text>
            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={4}
              value={resolutionNote}
              onChangeText={setResolutionNote}
              placeholder="Detail actions taken to verify passenger safety..."
              placeholderTextColor={colors.dark.textSecondary}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setResolveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmResolve}
              >
                <Text style={styles.modalConfirmText}>MARK RESOLVED</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 8,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.primary,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark.text,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F291E',
    borderColor: '#10B98155',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.dark.success,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.success,
    letterSpacing: 0.5,
  },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B0D0C',
    borderColor: colors.dark.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  criticalBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  criticalIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  criticalTitle: {
    color: '#F87171',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  criticalSubtitle: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 2,
  },
  criticalBannerBtn: {
    backgroundColor: colors.dark.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  criticalBannerBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 12,
    borderRadius: 10,
    borderColor: colors.dark.border,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark.text,
  },
  filterScroll: {
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.dark.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  alertId: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    fontWeight: '700',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  alertTime: {
    fontSize: 11,
    color: colors.dark.textSecondary,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark.text,
    marginBottom: 6,
  },
  busInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  busTag: {
    backgroundColor: '#1E293B',
    color: colors.dark.primary,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  alertDesc: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 6,
    width: 18,
  },
  detailValue: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopColor: colors.dark.border,
    borderTopWidth: 1,
  },
  ackButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ackButtonText: {
    color: '#F9FAFB',
    fontSize: 11,
    fontWeight: '800',
  },
  dispatchButton: {
    backgroundColor: '#7F1D1D',
    borderColor: colors.dark.error,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dispatchButtonText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '800',
  },
  resolveButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  resolvedLabel: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resolvedLabelText: {
    color: colors.dark.success,
    fontSize: 12,
    fontWeight: '700',
  },
  callIconBtn: {
    backgroundColor: colors.dark.surfaceSecondary,
    borderColor: colors.dark.border,
    borderWidth: 1,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  broadcastIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  broadcastTitle: {
    color: '#C7D2FE',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  broadcastSub: {
    color: '#A5B4FC',
    fontSize: 11,
    marginTop: 2,
  },
  broadcastArrow: {
    color: '#C7D2FE',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark.text,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.dark.textSecondary,
    padding: 4,
  },
  modalAlertSnippet: {
    backgroundColor: colors.dark.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderLeftColor: colors.dark.primary,
    borderLeftWidth: 3,
  },
  modalAlertId: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.dark.text,
  },
  modalAlertBus: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: colors.dark.background,
    borderColor: colors.dark.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: colors.dark.text,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceSecondary,
  },
  modalCancelText: {
    color: colors.dark.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.dark.primary,
  },
  modalConfirmText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
  },
});
