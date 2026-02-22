import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, FAB, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { StatCard, ListItemCard, SectionHeader, GradientCard, EmptyState } from '../../components/shared';
import { vitalSignsAPI } from '../../services/api';

const vitalIcons: Record<string, { icon: string; color: string; unit: string }> = {
  heart_rate: { icon: 'heart-pulse', color: '#ef5350', unit: 'bpm' },
  blood_pressure: { icon: 'water', color: '#42a5f5', unit: 'mmHg' },
  temperature: { icon: 'thermometer', color: '#ffa726', unit: '°F' },
  oxygen: { icon: 'lungs', color: '#66bb6a', unit: '%' },
  weight: { icon: 'scale-bathroom', color: '#7c4dff', unit: 'kg' },
  glucose: { icon: 'blood-bag', color: '#ff6090', unit: 'mg/dL' },
};

export default function VitalSignsScreen() {
  const [vitals, setVitals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await vitalSignsAPI.getAll();
      setVitals(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const latest = vitals.reduce((acc: Record<string, any>, v) => {
    if (!acc[v.type] || new Date(v.recorded_at) > new Date(acc[v.type].recorded_at)) acc[v.type] = v;
    return acc;
  }, {});

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <SectionHeader title="Current Readings" icon="heart-pulse" />
        <View style={styles.grid}>
          {Object.entries(latest).map(([type, v]) => {
            const info = vitalIcons[type] || { icon: 'chart-line', color: colors.primary, unit: '' };
            return (
              <StatCard key={type} label={type.replace(/_/g, ' ')}
                value={`${v.value}`} icon={info.icon} color={info.color}
                trend={v.status === 'normal' ? '✓ Normal' : '⚠ ' + v.status} />
            );
          })}
        </View>

        <SectionHeader title="Recent History" icon="history" />
        {vitals.length > 0 ? vitals.slice(0, 20).map((v, i) => {
          const info = vitalIcons[v.type] || { icon: 'chart-line', color: colors.primary, unit: '' };
          return (
            <ListItemCard key={v.id || i}
              title={v.type.replace(/_/g, ' ')}
              subtitle={`${v.value} ${info.unit}`}
              description={new Date(v.recorded_at).toLocaleString()}
              icon={info.icon} iconColor={info.color} status={v.status} />
          );
        }) : (
          <EmptyState icon="heart-off" title="No Vitals" message="Start tracking your vital signs to see your health trends." />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.primary },
});
