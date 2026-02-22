import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Chip, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { labsAPI } from '../../services/api';

export default function LabsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await labsAPI.getOrders();
      setOrders(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="Total Orders" value={orders.length} icon="test-tube" color={colors.primary} />
          <StatCard label="Pending" value={orders.filter(o => o.status === 'pending').length}
            icon="clock" color={colors.warning} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'pending', 'in_progress', 'completed'].map(f => (
            <Chip key={f} selected={filter === f} onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && { backgroundColor: `${colors.hospitalPortal}30` }]}
              textStyle={{ color: filter === f ? colors.hospitalPortal : colors.textSecondary }}>
              {f.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
            </Chip>
          ))}
        </ScrollView>

        <SectionHeader title={`${filtered.length} Lab Orders`} icon="test-tube" />
        {filtered.length > 0 ? filtered.map((o, i) => (
          <ListItemCard key={o.id || i}
            title={o.test_name || o.type}
            subtitle={`Patient: ${o.patient_name || 'Unknown'}`}
            description={`Ordered: ${o.ordered_at || o.date}\nDoctor: ${o.doctor_name || 'N/A'}`}
            icon="test-tube" iconColor={o.status === 'completed' ? colors.success : colors.warning}
            status={o.status} />
        )) : (
          <EmptyState icon="test-tube-off" title="No Lab Orders" message="Lab orders will appear here." />
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => {}} color="#000" customSize={56} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  filters: { marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.hospitalPortal },
});
