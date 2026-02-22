import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, FAB, Chip, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader } from '../../components/shared';
import { appointmentsAPI } from '../../services/api';

export default function AppointmentsScreen({ navigation }: any) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await appointmentsAPI.getAll();
      setAppointments(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filtered = appointments.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search && !a.doctor_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cancelAppointment = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        await appointmentsAPI.cancel(id).catch(() => {});
        loadData();
      }},
    ]);
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
      >
        <Searchbar
          placeholder="Search appointments..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          inputStyle={{ color: colors.text }}
          iconColor={colors.textTertiary}
          placeholderTextColor={colors.textTertiary}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && { backgroundColor: `${colors.primary}30` }]}
              textStyle={{ color: filter === f ? colors.primary : colors.textSecondary }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </ScrollView>

        <SectionHeader title={`${filtered.length} Appointments`} icon="calendar" />
        
        {filtered.length > 0 ? filtered.map((a, i) => (
          <ListItemCard
            key={a.id || i}
            title={a.doctor_name || 'Doctor'}
            subtitle={`${a.department || a.type} • ${a.date}`}
            description={`${a.time}${a.hospital_name ? ' • ' + a.hospital_name : ''}`}
            icon="calendar-clock"
            iconColor={a.status === 'scheduled' ? colors.info : a.status === 'completed' ? colors.success : colors.textSecondary}
            status={a.status}
            onPress={() => {
              if (a.status === 'scheduled') cancelAppointment(a.id);
            }}
          />
        )) : (
          <EmptyState icon="calendar-blank" title="No Appointments" message="You don't have any appointments matching this filter." actionLabel="Book Appointment" onAction={() => {}} />
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => Alert.alert('Book Appointment', 'Booking feature coming soon!')} color="#000" customSize={56} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  search: { backgroundColor: colors.surface, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  filters: { marginBottom: spacing.sm },
  chip: { marginRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.primary },
});
