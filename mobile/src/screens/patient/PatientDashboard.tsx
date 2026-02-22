import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Button, FAB, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';
import { StatCard, SectionHeader, ListItemCard, QuickAction, GradientCard } from '../../components/shared';
import { appointmentsAPI, vitalSignsAPI, medicationsAPI, notificationsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function PatientDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ appointments: 0, medications: 0, vitals: 0, unread: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentVitals, setRecentVitals] = useState<any[]>([]);
  const [activeMeds, setActiveMeds] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [appt, vitals, meds, notif] = await Promise.all([
        appointmentsAPI.getUpcoming().catch(() => ({ data: [] })),
        vitalSignsAPI.getLatest().catch(() => ({ data: [] })),
        medicationsAPI.getActive().catch(() => ({ data: [] })),
        notificationsAPI.getUnreadCount().catch(() => ({ data: { count: 0 } })),
      ]);
      const a = appt.data || [];
      const v = vitals.data || [];
      const m = meds.data || [];
      setUpcomingAppointments(a.slice(0, 3));
      setRecentVitals(Array.isArray(v) ? v.slice(0, 4) : []);
      setActiveMeds(m.slice(0, 3));
      setStats({
        appointments: a.length,
        medications: m.length,
        vitals: Array.isArray(v) ? v.length : 0,
        unread: notif.data?.count || 0,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              Welcome back,
            </Text>
            <Text variant="headlineSmall" style={{ color: colors.text, fontWeight: '700' }}>
              {user?.full_name || 'Patient'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={stats.unread > 0 ? colors.warning : colors.textSecondary}
              onPress={() => navigation.navigate('Notifications')}
            />
            <Avatar.Text
              size={40}
              label={(user?.full_name || 'P').substring(0, 2).toUpperCase()}
              style={styles.avatar}
              labelStyle={{ fontSize: 16 }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Appointments" value={stats.appointments} icon="calendar-check" color={colors.info} />
          <StatCard label="Medications" value={stats.medications} icon="pill" color={colors.success} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Vitals Logged" value={stats.vitals} icon="heart-pulse" color={colors.error} />
          <StatCard label="Unread" value={stats.unread} icon="bell-ring" color={colors.warning} />
        </View>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" icon="lightning-bolt" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          <QuickAction icon="calendar-plus" label="Book" color={colors.primary} onPress={() => navigation.navigate('Appointments')} />
          <QuickAction icon="pill" label="Meds" color={colors.success} onPress={() => navigation.navigate('Medications')} />
          <QuickAction icon="heart-pulse" label="Vitals" color={colors.error} onPress={() => navigation.navigate('VitalSigns')} />
          <QuickAction icon="test-tube" label="Blood" color={colors.warning} onPress={() => navigation.navigate('BloodTests')} />
          <QuickAction icon="video" label="Telehealth" color="#7c4dff" onPress={() => navigation.navigate('Telehealth')} />
          <QuickAction icon="alert-circle" label="Risk" color="#ff6090" onPress={() => navigation.navigate('CancerRisk')} />
          <QuickAction icon="stethoscope" label="Symptoms" color="#00e5ff" onPress={() => navigation.navigate('Symptoms')} />
          <QuickAction icon="file-document" label="Records" color="#69f0ae" onPress={() => navigation.navigate('HealthRecords')} />
        </ScrollView>

        {/* Upcoming Appointments */}
        <SectionHeader title="Upcoming Appointments" action="See All"
          onAction={() => navigation.navigate('Appointments')} icon="calendar" />
        {upcomingAppointments.length > 0 ? upcomingAppointments.map((a, i) => (
          <ListItemCard
            key={i}
            title={a.doctor_name || 'Doctor'}
            subtitle={a.department || a.type}
            description={`${a.date} at ${a.time}`}
            icon="calendar-clock"
            iconColor={colors.info}
            status={a.status}
          />
        )) : (
          <GradientCard>
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank" size={32} color={colors.textTertiary} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
                No upcoming appointments
              </Text>
              <Button mode="text" textColor={colors.primary} onPress={() => navigation.navigate('Appointments')}>
                Book Now
              </Button>
            </View>
          </GradientCard>
        )}

        {/* Active Medications */}
        <SectionHeader title="Active Medications" action="See All"
          onAction={() => navigation.navigate('Medications')} icon="pill" />
        {activeMeds.length > 0 ? activeMeds.map((m, i) => (
          <ListItemCard
            key={i}
            title={m.name}
            subtitle={`${m.dosage} • ${m.frequency}`}
            icon="pill"
            iconColor={colors.success}
            status={m.status}
          />
        )) : (
          <GradientCard>
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="pill" size={32} color={colors.textTertiary} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
                No active medications
              </Text>
            </View>
          </GradientCard>
        )}

        {/* Health Summary Card */}
        <SectionHeader title="Health Summary" icon="chart-line" />
        <GradientCard>
          <View style={styles.healthSummary}>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.success} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>AI Monitoring</Text>
              <Text variant="bodySmall" style={{ color: colors.success }}>Active</Text>
            </View>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="brain" size={24} color={colors.primary} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>Risk Score</Text>
              <Text variant="bodySmall" style={{ color: colors.primary }}>Low</Text>
            </View>
            <View style={styles.healthItem}>
              <MaterialCommunityIcons name="clock-check" size={24} color={colors.warning} />
              <Text variant="bodyMedium" style={{ color: colors.text, marginTop: 4 }}>Last Checkup</Text>
              <Text variant="bodySmall" style={{ color: colors.warning }}>2 weeks ago</Text>
            </View>
          </View>
        </GradientCard>

        <View style={{ height: 80 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primary + '30',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  quickActions: {
    marginBottom: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  healthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
  },
  healthItem: {
    alignItems: 'center',
  },
});
