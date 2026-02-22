import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { symptomsAPI } from '../../services/api';

export default function SymptomsScreen() {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await symptomsAPI.getAll();
      setSymptoms(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const severityColor = (s: string) =>
    s === 'severe' ? colors.error : s === 'moderate' ? colors.warning : colors.success;

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.row}>
          <StatCard label="Total" value={symptoms.length} icon="stethoscope" color={colors.info} />
          <StatCard label="Active" value={symptoms.filter(s => s.is_active).length} icon="alert-circle" color={colors.warning} />
        </View>

        <SectionHeader title="Symptom Log" icon="stethoscope" />

        {symptoms.length > 0 ? symptoms.map((s, i) => (
          <ListItemCard key={s.id || i} title={s.name}
            subtitle={`Severity: ${s.severity}`}
            description={`${s.description || ''}${s.started_at ? '\nStarted: ' + s.started_at : ''}`}
            icon="stethoscope" iconColor={severityColor(s.severity)} status={s.severity} />
        )) : (
          <EmptyState icon="stethoscope" title="No Symptoms" message="Log your symptoms to help your care team." />
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
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.primary },
});
