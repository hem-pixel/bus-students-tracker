// FILE: src/screens/parent/BoardingStatusScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { colors } from '../../theme/colors';

export default function BoardingStatusScreen() {
  const tracking = useSelector((state) => state.tracking);
  const [showQrModal, setShowQrModal] = useState(false);

  const history = [
    {
      date: 'Today, Sep 24',
      pickup: '07:42 AM (Sector 62)',
      drop: 'Pending (04:35 PM)',
      status: 'In Transit',
      bus: 'Bus #14',
      badgeColor: colors.dark.warning,
    },
    {
      date: 'Yesterday, Sep 23',
      pickup: '07:41 AM (Sector 62)',
      drop: '04:38 PM (Sector 62)',
      status: 'Completed',
      bus: 'Bus #14',
      badgeColor: colors.dark.success,
    },
    {
      date: 'Monday, Sep 22',
      pickup: '07:45 AM (Sector 62)',
      drop: '04:36 PM (Sector 62)',
      status: 'Completed',
      bus: 'Bus #14',
      badgeColor: colors.dark.success,
    },
    {
      date: 'Friday, Sep 19',
      pickup: '07:40 AM (Sector 62)',
      drop: '04:32 PM (Sector 62)',
      status: 'Completed',
      bus: 'Bus #14',
      badgeColor: colors.dark.success,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>BOARDING STATUS</Text>
            <Text style={styles.headerSubtitle}>Real-time biometric & RFID student telemetry</Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>SYNCED</Text>
          </View>
        </View>

        {/* Student Profile Card */}
        <View style={styles.studentCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🎓</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{tracking.studentName}</Text>
            <Text style={styles.studentMeta}>Roll: 2024-CS-089 • B.Tech CSE</Text>
            <Text style={styles.busMeta}>Assigned: {tracking.busNumber} • South Campus Express</Text>
          </View>
        </View>

        {/* Current Active Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.sectionLabel}>CURRENT STATUS</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{tracking.studentStatus.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.statusDetail}>
            Boarded at Sector 62 Main Stop at 07:42 AM via NFC Smart Card reader #2.
          </Text>

          <View style={styles.verificationRow}>
            <Text style={styles.verifiedIcon}>🛡️</Text>
            <Text style={styles.verificationText}>
              Biometric & RFID Verified • Cryptographically signed by bus terminal #BT-14
            </Text>
          </View>
        </View>

        {/* Schedule Cards */}
        <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleCard}>
            <Text style={styles.tripType}>🌅 MORNING TRIP</Text>
            <Text style={styles.scheduleTime}>07:40 AM</Text>
            <Text style={styles.scheduleSub}>Actual: 07:42 AM</Text>
            <View style={[styles.tripBadge, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
              <Text style={{ color: colors.dark.success, fontSize: 11, fontWeight: '700' }}>
                BOARDED
              </Text>
            </View>
          </View>

          <View style={styles.scheduleCard}>
            <Text style={styles.tripType}>🌆 AFTERNOON DROP</Text>
            <Text style={styles.scheduleTime}>04:30 PM</Text>
            <Text style={styles.scheduleSub}>Est: 04:35 PM</Text>
            <View style={[styles.tripBadge, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
              <Text style={{ color: colors.dark.warning, fontSize: 11, fontWeight: '700' }}>
                SCHEDULED
              </Text>
            </View>
          </View>
        </View>

        {/* Digital Boarding QR */}
        <TouchableOpacity style={styles.qrButton} onPress={() => setShowQrModal(true)}>
          <Text style={styles.qrButtonEmoji}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.qrButtonTitle}>DIGITAL EMERGENCY PASS</Text>
            <Text style={styles.qrButtonSubtitle}>Show offline encrypted QR for manual conductor check</Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>

        {/* Timeline History */}
        <Text style={styles.sectionTitle}>RECENT BOARDING LOGS</Text>
        {history.map((item, idx) => (
          <View key={idx} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <Text style={styles.historyDate}>{item.date}</Text>
              <View style={[styles.historyBadge, { borderColor: item.badgeColor }]}>
                <Text style={[styles.historyBadgeText, { color: item.badgeColor }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <View style={styles.historyDetails}>
              <Text style={styles.historyRow}>
                <Text style={styles.historyLabel}>Pickup: </Text>
                {item.pickup}
              </Text>
              <Text style={styles.historyRow}>
                <Text style={styles.historyLabel}>Dropoff: </Text>
                {item.drop}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* QR Modal */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>STUDENT BOARDING PASS</Text>
            <Text style={styles.modalSub}>Valid for Bus #14 • Route 4-A</Text>
            <View style={styles.qrPlaceholder}>
              <Text style={{ fontSize: 64 }}>🏁</Text>
              <Text style={styles.qrHash}>VSB-STUDENT-2024-CS089-VERIFIED</Text>
            </View>
            <Text style={styles.modalNotice}>
              Scan at bus door terminal when contactless card reader is unavailable.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQrModal(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE PASS</Text>
            </TouchableOpacity>
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
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.success,
  },
  studentCard: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark.text,
  },
  studentMeta: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  busMeta: {
    fontSize: 12,
    color: colors.dark.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: 'rgba(17,24,39,0.95)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.primary,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  statusDetail: {
    color: colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  verifiedIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  verificationText: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  tripType: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 6,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark.text,
  },
  scheduleSub: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  tripBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qrButton: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrButtonEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  qrButtonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark.text,
  },
  qrButtonSubtitle: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    marginTop: 1,
  },
  chevron: {
    fontSize: 16,
    color: colors.dark.primary,
    fontWeight: '800',
  },
  historyCard: {
    backgroundColor: colors.dark.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: 8,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark.text,
  },
  historyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyDetails: {
    marginTop: 2,
  },
  historyRow: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginVertical: 1,
  },
  historyLabel: {
    color: colors.dark.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark.text,
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 12,
    color: colors.dark.primary,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  qrHash: {
    fontSize: 9,
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  modalNotice: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    width: '100%',
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
