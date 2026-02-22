import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { hospitalsAPI } from '../../services/api';

export default function HospitalManagementScreen() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await hospitalsAPI.getAll();
      setHospitals(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = hospitals.filter(h => {
    const nm = (h.name || '').toLowerCase();
    return !search || nm.includes(search.toLowerCase());
  });

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="Total" value={hospitals.length} icon="hospital-building" color={colors.info} />
          <StatCard label="Active" value={hospitals.filter(h => h.is_active).length}
            icon="check-circle" color={colors.success} />
        </View>

        <Searchbar placeholder="Search hospitals..." value={search} onChangeText={setSearch}
          style={styles.search} inputStyle={{ color: colors.text }}
          iconColor={colors.textTertiary} placeholderTextColor={colors.textTertiary} />

        <SectionHeader title={`${filtered.length} Hospitals`} icon="hospital-building" />
        {filtered.length > 0 ? filtered.map((h, i) => (
          <ListItemCard key={h.id || i}
            title={h.name}
            subtitle={`${h.address || h.city || ''}`}
            description={`Beds: ${h.total_beds || 'N/A'} • Doctors: ${h.doctors_count || 'N/A'}\nPhone: ${h.phone || 'N/A'}`}
            icon="hospital-building" iconColor={h.is_active ? colors.info : colors.textSecondary}
            status={h.is_active ? 'active' : 'inactive'} />
        )) : (
          <EmptyState icon="hospital-building" title="No Hospitals" message="Registered hospitals will appear here." />
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
  search: { backgroundColor: colors.surface, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.adminPortal },
});
