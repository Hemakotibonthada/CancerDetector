import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { bloodTestsAPI } from '../../services/api';

export default function BloodTestsScreen() {
  const [tests, setTests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await bloodTestsAPI.getAll();
      setTests(res.data || []);
    } catch (e) { console.error(e); }
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

        <View style={styles.row}>
          <StatCard label="Total Tests" value={tests.length} icon="test-tube" color={colors.primary} />
          <StatCard label="Pending" value={tests.filter(t => t.status === 'pending').length} icon="clock" color={colors.warning} />
        </View>

        <SectionHeader title="Blood Test Results" icon="test-tube" />

        {tests.length > 0 ? tests.map((t, i) => (
          <ListItemCard key={t.id || i} title={t.test_name || t.type}
            subtitle={`Ordered by: ${t.ordered_by || 'Doctor'}`}
            description={`Date: ${t.date}${t.result ? '\nResult: ' + t.result : ''}`}
            icon="test-tube" iconColor={t.status === 'completed' ? colors.success : colors.warning}
            status={t.status} />
        )) : (
          <EmptyState icon="test-tube-off" title="No Blood Tests" message="Your blood test results will appear here." />
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
});
