import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Chip, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard, GradientCard } from '../../components/shared';
import { medicationsAPI } from '../../services/api';

export default function MedicationsScreen() {
  const [meds, setMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const res = await medicationsAPI.getAll();
      setMeds(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = meds.filter(m => filter === 'all' || m.status === filter);
  const active = meds.filter(m => m.status === 'active').length;

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.statsRow}>
          <StatCard label="Active" value={active} icon="pill" color={colors.success} />
          <StatCard label="Total" value={meds.length} icon="clipboard-list" color={colors.info} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'active', 'completed', 'paused'].map(f => (
            <Chip key={f} selected={filter === f} onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && { backgroundColor: `${colors.primary}30` }]}
              textStyle={{ color: filter === f ? colors.primary : colors.textSecondary }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        <SectionHeader title={`${filtered.length} Medications`} icon="pill" />

        {filtered.length > 0 ? filtered.map((m, i) => (
          <ListItemCard key={m.id || i} title={m.name}
            subtitle={`${m.dosage} • ${m.frequency}`}
            description={`Prescribed by ${m.prescribed_by}${m.instructions ? '\n' + m.instructions : ''}`}
            icon="pill" iconColor={m.status === 'active' ? colors.success : colors.textSecondary}
            status={m.status} />
        )) : (
          <EmptyState icon="pill-off" title="No Medications" message="No medications matching this filter." />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  filters: { marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
