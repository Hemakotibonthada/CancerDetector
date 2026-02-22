import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { doctorsAPI } from '../../services/api';

export default function StaffScreen() {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await doctorsAPI.getAll();
      setStaff(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = staff.filter(s => {
    const nm = (s.full_name || s.name || '').toLowerCase();
    return !search || nm.includes(search.toLowerCase());
  });

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="Total Staff" value={staff.length} icon="doctor" color={colors.info} />
          <StatCard label="On Duty" value={staff.filter(s => s.status === 'on_duty' || s.is_available).length}
            icon="account-check" color={colors.success} />
        </View>

        <Searchbar placeholder="Search staff..." value={search} onChangeText={setSearch}
          style={styles.search} inputStyle={{ color: colors.text }}
          iconColor={colors.textTertiary} placeholderTextColor={colors.textTertiary} />

        <SectionHeader title={`${filtered.length} Staff Members`} icon="doctor" />
        {filtered.length > 0 ? filtered.map((s, i) => (
          <ListItemCard key={s.id || i}
            title={s.full_name || s.name}
            subtitle={`${s.specialization || s.department || 'General'}`}
            description={`${s.qualification || ''}\nPatients: ${s.patient_count || 0}`}
            icon="doctor" iconColor={s.is_available ? colors.success : colors.textSecondary}
            status={s.is_available ? 'available' : 'away'} />
        )) : (
          <EmptyState icon="doctor" title="No Staff" message="Staff members will appear here." />
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
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.hospitalPortal },
});
