import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../theme';
import { StatCard, SectionHeader, ListItemCard, QuickAction, GradientCard } from '../../components/shared';
import { usersAPI, hospitalsAPI, systemAPI, auditAPI, analyticsAPI } from '../../services/api';

export default function AdminDashboard({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: 0, hospitals: 0, activeUsers: 0,
    systemHealth: 'Healthy', uptime: '99.9%', alerts: 0,
  });
  const [recentAudit, setRecentAudit] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [u, h, sys, audit] = await Promise.all([
        usersAPI.getAll().catch(() => ({ data: [] })),
        hospitalsAPI.getAll().catch(() => ({ data: [] })),
        systemAPI.getMetrics().catch(() => ({ data: {} })),
        auditAPI.getLogs().catch(() => ({ data: [] })),
      ]);
      const users = u.data || [];
      setStats({
        users: users.length,
        hospitals: (h.data || []).length,
        activeUsers: users.filter((x: any) => x.is_active).length,
        systemHealth: sys.data?.health || 'Healthy',
        uptime: sys.data?.uptime || '99.9%',
        alerts: sys.data?.alerts || 0,
      });
      setRecentAudit((audit.data || []).slice(0, 5));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <View>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>Admin Portal</Text>
            <Text variant="headlineSmall" style={{ color: colors.text, fontWeight: '700' }}>
              System Overview
            </Text>
          </View>
          <Avatar.Text size={40}
            label={(user?.full_name || 'A').substring(0, 2).toUpperCase()}
            style={{ backgroundColor: colors.adminPortal + '30' }}
            labelStyle={{ fontSize: 16 }} />
        </View>

        {/* Platform Stats */}
        <View style={styles.row}>
          <StatCard label="Total Users" value={stats.users} icon="account-group" color={colors.primary} />
          <StatCard label="Hospitals" value={stats.hospitals} icon="hospital-building" color={colors.info} />
        </View>
        <View style={styles.row}>
          <StatCard label="Active Users" value={stats.activeUsers} icon="account-check" color={colors.success} />
          <StatCard label="System Alerts" value={stats.alerts} icon="alert" color={colors.error} />
        </View>

        {/* System Health */}
        <SectionHeader title="System Health" icon="server" />
        <GradientCard>
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="server" size={28} color={colors.success} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>Server</Text>
              <Text variant="bodySmall" style={{ color: colors.success }}>{stats.systemHealth}</Text>
            </View>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="clock-check" size={28} color={colors.primary} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>Uptime</Text>
              <Text variant="bodySmall" style={{ color: colors.primary }}>{stats.uptime}</Text>
            </View>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="database" size={28} color={colors.info} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>Database</Text>
              <Text variant="bodySmall" style={{ color: colors.info }}>Connected</Text>
            </View>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="shield-check" size={28} color={colors.success} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>Security</Text>
              <Text variant="bodySmall" style={{ color: colors.success }}>Secure</Text>
            </View>
          </View>
        </GradientCard>

        {/* Quick Actions */}
        <SectionHeader title="Admin Actions" icon="lightning-bolt" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          <QuickAction icon="account-plus" label="Add User" color={colors.primary} onPress={() => navigation.navigate('Users')} />
          <QuickAction icon="hospital-building" label="Hospitals" color={colors.info} onPress={() => navigation.navigate('Hospitals')} />
          <QuickAction icon="monitor-dashboard" label="System" color={colors.warning} onPress={() => navigation.navigate('System')} />
          <QuickAction icon="shield-lock" label="Security" color={colors.error} onPress={() => navigation.navigate('More')} />
          <QuickAction icon="chart-bar" label="Analytics" color={colors.success} onPress={() => navigation.navigate('More')} />
        </ScrollView>

        {/* Recent Audit Log */}
        <SectionHeader title="Recent Activity" action="View All"
          onAction={() => navigation.navigate('More')} icon="history" />
        {recentAudit.length > 0 ? recentAudit.map((a, i) => (
          <ListItemCard key={i} title={a.action || a.event}
            subtitle={a.user_name || a.user_email}
            description={new Date(a.timestamp || a.created_at).toLocaleString()}
            icon="history" iconColor={colors.textSecondary} />
        )) : (
          <GradientCard>
            <View style={{ alignItems: 'center', padding: spacing.lg }}>
              <MaterialCommunityIcons name="history" size={32} color={colors.textTertiary} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
                No recent activity
              </Text>
            </View>
          </GradientCard>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg, marginTop: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', padding: spacing.lg },
  healthItem: { alignItems: 'center', width: '45%', marginBottom: spacing.md },
  quickActions: { marginBottom: spacing.sm },
});
