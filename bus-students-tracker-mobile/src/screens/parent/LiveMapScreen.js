// FILE: src/screens/parent/LiveMapScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { advanceToNextStop } from '../../store/trackingSlice';
import { colors } from '../../theme/colors';

export default function LiveMapScreen() {
  const dispatch = useDispatch();
  const tracking = useSelector((state) => state.tracking);
  const [etaRemaining, setEtaRemaining] = useState(tracking.etaMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleCallDriver = () => {
    Linking.openURL(`tel:${tracking.driverPhone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Calling Driver', `Dialing ${tracking.driverPhone}`);
    });
  };

  const handleEmergencySOS = () => {
    Alert.alert(
      'EMERGENCY SOS',
      'This will broadcast an urgent emergency ping to Campus Transport Central and campus security with your live GPS location. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'BROADCAST SOS',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'SOS Transmitted',
              'Security dispatched. Driver & control room notified.'
            ),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.appTitle}>BUS #101 LIVE TRACKING</Text>
          <Text style={styles.appSubtitle}>{tracking.routeName}</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>{tracking.status}</Text>
        </View>
      </View>

      {/* Map View Area (Fallback stylized radar canvas) */}
      <View style={styles.mapCanvas}>
        <View style={styles.mapGridLine1} />
        <View style={styles.mapGridLine2} />
        <View style={styles.mapCenterRadar}>
          <View style={styles.pulseRing} />
          <Text style={styles.busMarker}>🚌</Text>
        </View>

        {/* Floating Telemetry Badge */}
        <View style={styles.telemetryBadge}>
          <Text style={styles.speedLabel}>SPEED</Text>
          <Text style={styles.speedValue}>{tracking.currentSpeed} km/h</Text>
        </View>

        {/* Floating Controls */}
        <TouchableOpacity
          style={styles.simulateStepBtn}
          onPress={() => dispatch(advanceToNextStop())}
        >
          <Text style={styles.simulateStepText}>⏩ Advance Stop</Text>
        </TouchableOpacity>
      </View>

      {/* ETA & Next Stop Panel */}
      <View style={styles.panel}>
        <View style={styles.etaRow}>
          <View>
            <Text style={styles.label}>ESTIMATED ARRIVAL</Text>
            <Text style={styles.etaText}>{formatCountdown(etaRemaining)}</Text>
          </View>
          <View style={styles.nextStopBlock}>
            <Text style={styles.label}>APPROACHING</Text>
            <Text style={styles.nextStopText} numberOfLines={1}>
              {tracking.nextStopName}
            </Text>
          </View>
        </View>

        {/* Driver Contact Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>👨‍✈️</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.driverName}>{tracking.driverName}</Text>
            <Text style={styles.driverInfo}>Rating: ★ {tracking.driverRating} • Certified Pilot</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
            <Text style={styles.callBtnText}>📞 CALL</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons: SOS & Message */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => Alert.alert('Message Sent', 'Driver alerted to wait for student.')}
          >
            <Text style={styles.messageBtnText}>💬 Alert Driver (Wait 1m)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sosBtn} onPress={handleEmergencySOS}>
            <Text style={styles.sosBtnText}>🚨 SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    backgroundColor: colors.dark.surface,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark.text,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.success,
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#090D14',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapGridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mapGridLine2: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  mapCenterRadar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  busMarker: {
    fontSize: 32,
  },
  telemetryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  speedLabel: {
    fontSize: 10,
    color: colors.dark.textMuted,
    fontWeight: '700',
  },
  speedValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark.text,
  },
  simulateStepBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.dark.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  simulateStepText: {
    color: colors.dark.text,
    fontSize: 11,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  etaText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.dark.primary,
  },
  nextStopBlock: {
    alignItems: 'flex-end',
    maxWidth: '55%',
  },
  nextStopText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.text,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    fontSize: 22,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.text,
  },
  driverInfo: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: colors.dark.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    color: '#05070A',
    fontWeight: '800',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  messageBtn: {
    flex: 1,
    backgroundColor: colors.dark.card,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  messageBtnText: {
    color: colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sosBtn: {
    backgroundColor: colors.dark.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  sosBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
