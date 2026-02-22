import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, Chip, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { patientsAPI } from '../../services/api';

export default function PatientManagementScreen({ navigation }: any) {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await patientsAPI.getAll();
      setPatients(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = patients.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    const nm = (p.full_name || p.name || '').toLowerCase();
    if (search && !nm.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="Total" value={patients.length} icon="account-group" color={colors.info} />
          <StatCard label="Active" value={patients.filter(p => p.status === 'active' || p.status === 'admitted').length}
            icon="account-check" color={colors.success} />
        </View>

        <Searchbar placeholder="Search patients..." value={search} onChangeText={setSearch}
          style={styles.search} inputStyle={{ color: colors.text }}
          iconColor={colors.textTertiary} placeholderTextColor={colors.textTertiary} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'admitted', 'discharged', 'critical', 'outpatient'].map(f => (
            <Chip key={f} selected={filter === f} onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && { backgroundColor: `${colors.hospitalPortal}30` }]}
              textStyle={{ color: filter === f ? colors.hospitalPortal : colors.textSecondary }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        <SectionHeader title={`${filtered.length} Patients`} icon="account-group" />
        {filtered.length > 0 ? filtered.map((p, i) => (
          <ListItemCard key={p.id || i}
            title={p.full_name || p.name}
            subtitle={`${p.department || 'General'} • Age: ${p.age || 'N/A'}`}
            description={`${p.diagnosis || ''}\nAdmitted: ${p.admission_date || 'N/A'}`}
            icon="account" iconColor={p.status === 'critical' ? colors.error : colors.info}
            status={p.status} />
        )) : (
          <EmptyState icon="account-off" title="No Patients" message="No patients match your filter." />
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="account-plus" style={styles.fab} onPress={() => {}} color="#000" customSize={56} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  search: { backgroundColor: colors.surface, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  filters: { marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.hospitalPortal },
});
