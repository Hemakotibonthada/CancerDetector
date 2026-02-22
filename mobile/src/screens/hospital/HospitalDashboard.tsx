import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../theme';
import { StatCard, SectionHeader, ListItemCard, QuickAction, GradientCard } from '../../components/shared';
import { patientsAPI, doctorsAPI, bedsAPI, labsAPI, emergencyAPI } from '../../services/api';

export default function HospitalDashboard({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    patients: 0, doctors: 0, beds: { total: 0, available: 0 },
    emergencies: 0, labs: 0, occupancy: 0,
  });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [activeEmergencies, setActiveEmergencies] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [p, d, b, e, l] = await Promise.all([
        patientsAPI.getAll().catch(() => ({ data: [] })),
        doctorsAPI.getAll().catch(() => ({ data: [] })),
        bedsAPI.getAll().catch(() => ({ data: [] })),
        emergencyAPI.getActive().catch(() => ({ data: [] })),
        labsAPI.getOrders().catch(() => ({ data: [] })),
      ]);
      const patients = p.data || [];
      const beds = b.data || [];
      const avail = beds.filter((x: any) => x.status === 'available').length;
      setStats({
        patients: patients.length,
        doctors: (d.data || []).length,
        beds: { total: beds.length, available: avail },
        emergencies: (e.data || []).length,
        labs: (l.data || []).length,
        occupancy: beds.length ? Math.round(((beds.length - avail) / beds.length) * 100) : 0,
      });
      setRecentPatients(patients.slice(0, 5));
      setActiveEmergencies((e.data || []).slice(0, 3));
    } catch (err) { console.error(err); }
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

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>Hospital Portal</Text>
            <Text variant="headlineSmall" style={{ color: colors.text, fontWeight: '700' }}>
              {user?.full_name || 'Hospital Admin'}
            </Text>
          </View>
          <Avatar.Text size={40}
            label={(user?.full_name || 'H').substring(0, 2).toUpperCase()}
            style={{ backgroundColor: colors.hospitalPortal + '30' }}
            labelStyle={{ fontSize: 16 }} />
        </View>

        {/* Stats Grid */}
        <View style={styles.row}>
          <StatCard label="Patients" value={stats.patients} icon="account-group" color={colors.info} />
          <StatCard label="Doctors" value={stats.doctors} icon="doctor" color={colors.success} />
        </View>
        <View style={styles.row}>
          <StatCard label="Beds Available" value={`${stats.beds.available}/${stats.beds.total}`}
            icon="bed" color={colors.warning} trend={`${stats.occupancy}% occupancy`} />
          <StatCard label="Emergencies" value={stats.emergencies} icon="ambulance" color={colors.error} />
        </View>
        <View style={styles.row}>
          <StatCard label="Lab Orders" value={stats.labs} icon="test-tube" color="#7c4dff" />
          <StatCard label="Occupancy" value={`${stats.occupancy}%`} icon="chart-donut" color={colors.primary} />
        </View>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" icon="lightning-bolt" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          <QuickAction icon="account-plus" label="Admit" color={colors.primary} onPress={() => navigation.navigate('Patients')} />
          <QuickAction icon="bed" label="Beds" color={colors.warning} onPress={() => navigation.navigate('BedManagement')} />
          <QuickAction icon="test-tube" label="Labs" color="#7c4dff" onPress={() => navigation.navigate('Labs')} />
          <QuickAction icon="pill" label="Pharmacy" color={colors.success} onPress={() => navigation.navigate('Pharmacy')} />
          <QuickAction icon="ambulance" label="Emergency" color={colors.error} onPress={() => navigation.navigate('Emergency')} />
          <QuickAction icon="account-group" label="Staff" color={colors.info} onPress={() => navigation.navigate('Staff')} />
        </ScrollView>

        {/* Active Emergencies */}
        {activeEmergencies.length > 0 && (
          <>
            <SectionHeader title="Active Emergencies" icon="ambulance"
              action="View All" onAction={() => navigation.navigate('Emergency')} />
            {activeEmergencies.map((e, i) => (
              <ListItemCard key={i} title={e.patient_name || 'Patient'}
                subtitle={e.type || e.description} description={e.time}
                icon="ambulance" iconColor={colors.error} status="critical" />
            ))}
          </>
        )}

        {/* Recent Patients */}
        <SectionHeader title="Recent Patients" action="View All"
          onAction={() => navigation.navigate('Patients')} icon="account-group" />
        {recentPatients.length > 0 ? recentPatients.map((p, i) => (
          <ListItemCard key={i} title={p.full_name || p.name}
            subtitle={p.department || p.diagnosis}
            description={`Admitted: ${p.admission_date || 'N/A'}`}
            icon="account" iconColor={colors.info} status={p.status} />
        )) : (
          <GradientCard>
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-group" size={32} color={colors.textTertiary} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
                No recent patients
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
  quickActions: { marginBottom: spacing.sm },
  emptyCard: { alignItems: 'center', padding: spacing.lg },
});
