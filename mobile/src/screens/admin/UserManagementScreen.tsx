import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Searchbar, Chip, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { usersAPI } from '../../services/api';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const filtered = users.filter(u => {
    if (filter !== 'all' && u.role !== filter) return false;
    const nm = (u.full_name || u.email || '').toLowerCase();
    return !search || nm.includes(search.toLowerCase());
  });

  const toggleUser = (u: any) => {
    Alert.alert(
      u.is_active ? 'Deactivate User' : 'Activate User',
      `Are you sure you want to ${u.is_active ? 'deactivate' : 'activate'} ${u.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          await usersAPI.update(u.id, { is_active: !u.is_active }).catch(() => {});
          loadData();
        }},
      ]
    );
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="Total Users" value={users.length} icon="account-group" color={colors.primary} />
          <StatCard label="Active" value={users.filter(u => u.is_active).length}
            icon="account-check" color={colors.success} />
        </View>

        <Searchbar placeholder="Search users..." value={search} onChangeText={setSearch}
          style={styles.search} inputStyle={{ color: colors.text }}
          iconColor={colors.textTertiary} placeholderTextColor={colors.textTertiary} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'patient', 'doctor', 'hospital_admin', 'admin'].map(f => (
            <Chip key={f} selected={filter === f} onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && { backgroundColor: `${colors.adminPortal}30` }]}
              textStyle={{ color: filter === f ? colors.adminPortal : colors.textSecondary }}>
              {f.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
            </Chip>
          ))}
        </ScrollView>

        <SectionHeader title={`${filtered.length} Users`} icon="account-group" />
        {filtered.length > 0 ? filtered.map((u, i) => (
          <ListItemCard key={u.id || i}
            title={u.full_name || u.email}
            subtitle={`${u.role?.replace(/_/g, ' ')} • ${u.email}`}
            description={`Joined: ${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}`}
            icon={u.role === 'doctor' ? 'doctor' : u.role === 'admin' ? 'shield-account' : 'account'}
            iconColor={u.is_active ? colors.success : colors.error}
            status={u.is_active ? 'active' : 'inactive'}
            onPress={() => toggleUser(u)} />
        )) : (
          <EmptyState icon="account-off" title="No Users" message="No users match your search." />
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
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.adminPortal },
});
