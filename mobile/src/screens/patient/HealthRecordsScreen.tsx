import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader } from '../../components/shared';
import { healthRecordsAPI } from '../../services/api';

export default function HealthRecordsScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const res = await healthRecordsAPI.getAll();
      setRecords(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = records.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = ['all', ...new Set(records.map(r => r.type).filter(Boolean))];

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <Searchbar placeholder="Search records..." value={search} onChangeText={setSearch}
          style={styles.search} inputStyle={{ color: colors.text }}
          iconColor={colors.textTertiary} placeholderTextColor={colors.textTertiary} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {types.map(t => (
            <Chip key={t} selected={filter === t} onPress={() => setFilter(t)}
              style={[styles.chip, filter === t && { backgroundColor: `${colors.primary}30` }]}
              textStyle={{ color: filter === t ? colors.primary : colors.textSecondary }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        <SectionHeader title={`${filtered.length} Records`} icon="file-document" />

        {filtered.length > 0 ? filtered.map((r, i) => (
          <ListItemCard key={r.id || i} title={r.title} subtitle={r.type}
            description={`${r.provider} • ${r.date}`}
            icon="file-document-outline" iconColor={colors.primary} />
        )) : (
          <EmptyState icon="file-document-remove" title="No Records" message="Your health records will appear here." />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  search: { backgroundColor: colors.surface, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  filters: { marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
