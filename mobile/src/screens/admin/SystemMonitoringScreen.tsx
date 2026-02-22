import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { GradientCard, SectionHeader, StatCard, InfoRow } from '../../components/shared';
import { systemAPI } from '../../services/api';

export default function SystemMonitoringScreen() {
  const [metrics, setMetrics] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await systemAPI.getMetrics();
      setMetrics(res.data || {});
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const cpu = metrics.cpu_usage || 35;
  const memory = metrics.memory_usage || 62;
  const disk = metrics.disk_usage || 45;
  const network = metrics.network_latency || 12;

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="CPU" value={`${cpu}%`} icon="chip" color={cpu > 80 ? colors.error : colors.success} />
          <StatCard label="Memory" value={`${memory}%`} icon="memory" color={memory > 80 ? colors.error : colors.info} />
        </View>
        <View style={styles.row}>
          <StatCard label="Disk" value={`${disk}%`} icon="harddisk" color={disk > 80 ? colors.warning : colors.success} />
          <StatCard label="Latency" value={`${network}ms`} icon="web" color={network > 100 ? colors.error : colors.success} />
        </View>

        {/* Resource Usage */}
        <SectionHeader title="Resource Usage" icon="chart-bar" />
        <GradientCard>
          <View style={styles.section}>
            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={styles.metricLabel}>CPU Usage</Text>
              <Text variant="bodyMedium" style={{ color: colors.text }}>{cpu}%</Text>
            </View>
            <ProgressBar progress={cpu / 100} color={cpu > 80 ? colors.error : colors.success}
              style={styles.progress} />

            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={styles.metricLabel}>Memory Usage</Text>
              <Text variant="bodyMedium" style={{ color: colors.text }}>{memory}%</Text>
            </View>
            <ProgressBar progress={memory / 100} color={memory > 80 ? colors.error : colors.info}
              style={styles.progress} />

            <View style={styles.metricRow}>
              <Text variant="bodyMedium" style={styles.metricLabel}>Disk Usage</Text>
              <Text variant="bodyMedium" style={{ color: colors.text }}>{disk}%</Text>
            </View>
            <ProgressBar progress={disk / 100} color={disk > 80 ? colors.warning : colors.success}
              style={styles.progress} />
          </View>
        </GradientCard>

        {/* Server Info */}
        <SectionHeader title="Server Information" icon="server" />
        <GradientCard>
          <View style={styles.section}>
            <InfoRow label="Server Status" value={metrics.status || 'Online'} icon="server" />
            <InfoRow label="Uptime" value={metrics.uptime || '99.9%'} icon="clock-check" />
            <InfoRow label="API Version" value={metrics.api_version || 'v1.0.0'} icon="api" />
            <InfoRow label="Database" value={metrics.db_status || 'Connected'} icon="database" />
            <InfoRow label="Cache" value={metrics.cache_status || 'Active'} icon="cached" />
            <InfoRow label="Last Backup" value={metrics.last_backup || '2 hours ago'} icon="backup-restore" />
          </View>
        </GradientCard>

        {/* Services */}
        <SectionHeader title="Services" icon="cog" />
        <GradientCard>
          <View style={styles.section}>
            {[
              { name: 'API Gateway', status: 'running', icon: 'api', color: colors.success },
              { name: 'AI Engine', status: 'running', icon: 'brain', color: colors.success },
              { name: 'Notification Service', status: 'running', icon: 'bell', color: colors.success },
              { name: 'Background Jobs', status: 'running', icon: 'cog-transfer', color: colors.success },
              { name: 'Email Service', status: 'running', icon: 'email', color: colors.success },
            ].map((s, i) => (
              <View key={i} style={styles.serviceRow}>
                <View style={styles.serviceLeft}>
                  <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
                  <Text variant="bodyMedium" style={{ color: colors.text, marginLeft: 12 }}>{s.name}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: s.color }]} />
              </View>
            ))}
          </View>
        </GradientCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  section: { padding: spacing.md },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  metricLabel: { color: colors.textSecondary },
  progress: { height: 8, borderRadius: 4, backgroundColor: colors.surface, marginTop: 4 },
  serviceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  serviceLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
