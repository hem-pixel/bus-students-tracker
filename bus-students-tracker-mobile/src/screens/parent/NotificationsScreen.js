// FILE: src/screens/parent/NotificationsScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { markAsRead, markAllAsRead } from '../../store/notificationsSlice';
import { colors } from '../../theme/colors';

export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.items);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'BOARDING', 'ALERTS', 'DELAYS', 'SYSTEM'];

  const filteredNotifications = notifications.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'BOARDING') return item.type === 'BOARDING' || item.type === 'DEPARTURE';
    if (selectedCategory === 'ALERTS') return item.type === 'EMERGENCY' || item.severity === 'high';
    if (selectedCategory === 'DELAYS') return item.type === 'DELAY' || item.type === 'TRAFFIC';
    if (selectedCategory === 'SYSTEM') return item.type === 'SYSTEM' || item.type === 'GEOFENCE';
    return true;
  });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'high':
        return { border: colors.dark.error, bg: 'rgba(239,68,68,0.15)', text: colors.dark.error };
      case 'warning':
        return { border: colors.dark.warning, bg: 'rgba(245,158,11,0.15)', text: colors.dark.warning };
      case 'success':
        return { border: colors.dark.success, bg: 'rgba(16,185,129,0.15)', text: colors.dark.success };
      default:
        return { border: colors.dark.info, bg: 'rgba(59,130,246,0.15)', text: colors.dark.info };
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const renderItem = ({ item }) => {
    const sevStyle = getSeverityStyle(item.severity);

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => dispatch(markAsRead(item.id))}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeBadgeRow}>
            <View style={[styles.sevBadge, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
              <Text style={[styles.sevBadgeText, { color: sevStyle.text }]}>
                {item.type || 'NOTIFICATION'}
              </Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.timestamp}>{item.timestamp || 'Just now'}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.message || item.body}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.sender}>From: Campus Transport System</Text>
          {!item.read && (
            <TouchableOpacity onPress={() => dispatch(markAsRead(item.id))}>
              <Text style={styles.markReadText}>Mark read</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DISPATCH NOTIFICATIONS</Text>
          <Text style={styles.headerSubtitle}>Real-time campus & vehicle announcements</Text>
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>MARK ALL READ</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No Notifications in this Category</Text>
            <Text style={styles.emptySubtitle}>You're all caught up with campus transit alerts.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
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
  markAllButton: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  markAllText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.dark.primary,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
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
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.dark.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: 10,
  },
  unreadCard: {
    borderColor: colors.dark.primary,
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sevBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  sevBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.dark.primary,
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 11,
    color: colors.dark.textSecondary,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  sender: {
    fontSize: 10,
    color: colors.dark.textTertiary,
  },
  markReadText: {
    fontSize: 11,
    color: colors.dark.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
});
