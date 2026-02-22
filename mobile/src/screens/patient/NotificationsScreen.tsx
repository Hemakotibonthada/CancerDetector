import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader } from '../../components/shared';
import { notificationsAPI } from '../../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const iconMap: Record<string, { icon: string; color: string }> = {
    appointment: { icon: 'calendar', color: colors.info },
    medication: { icon: 'pill', color: colors.success },
    result: { icon: 'test-tube', color: colors.primary },
    alert: { icon: 'alert-circle', color: colors.error },
    message: { icon: 'email', color: '#7c4dff' },
    system: { icon: 'cog', color: colors.textSecondary },
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <SectionHeader title="Notifications" icon="bell" />

        {notifications.length > 0 ? notifications.map((n, i) => {
          const info = iconMap[n.type] || iconMap.system;
          return (
            <ListItemCard key={n.id || i} title={n.title}
              subtitle={n.message}
              description={new Date(n.created_at).toLocaleString()}
              icon={info.icon} iconColor={n.is_read ? colors.textTertiary : info.color}
              onPress={async () => {
                if (!n.is_read) await notificationsAPI.markRead(n.id).catch(() => {});
                loadData();
              }} />
          );
        }) : (
          <EmptyState icon="bell-off" title="No Notifications" message="You're all caught up!" />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
});
