import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { GradientCard, SectionHeader, StatCard, InfoRow } from '../../components/shared';
import { cancerRiskAPI } from '../../services/api';

export default function CancerRiskScreen() {
  const [risk, setRisk] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await cancerRiskAPI.getAssessments();
      setRisk(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const riskLevel = risk?.overall_risk || 'low';
  const riskColor = riskLevel === 'high' ? colors.error : riskLevel === 'medium' ? colors.warning : colors.success;
  const riskScore = risk?.risk_score || 15;

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        {/* Risk Score Card */}
        <GradientCard>
          <View style={styles.riskCard}>
            <MaterialCommunityIcons name="shield-check" size={48} color={riskColor} />
            <Text variant="headlineLarge" style={[styles.riskScore, { color: riskColor }]}>
              {riskScore}%
            </Text>
            <Text variant="titleMedium" style={{ color: colors.text, marginBottom: 8 }}>
              Overall Cancer Risk Score
            </Text>
            <View style={[styles.riskBadge, { backgroundColor: `${riskColor}20`, borderColor: `${riskColor}50` }]}>
              <Text variant="labelLarge" style={{ color: riskColor }}>
                {riskLevel.toUpperCase()} RISK
              </Text>
            </View>
            <ProgressBar progress={riskScore / 100} color={riskColor}
              style={styles.progressBar} />
          </View>
        </GradientCard>

        {/* Risk Factors */}
        <SectionHeader title="Risk Factors" icon="alert-circle" />
        <GradientCard>
          <View style={styles.section}>
            <InfoRow label="Family History" value={risk?.family_history || 'Not assessed'} icon="family-tree" />
            <InfoRow label="Genetic Markers" value={risk?.genetic_markers || 'Not tested'} icon="dna" />
            <InfoRow label="Lifestyle Score" value={risk?.lifestyle_score || 'N/A'} icon="run" />
            <InfoRow label="Environmental" value={risk?.environmental || 'Low exposure'} icon="tree" />
          </View>
        </GradientCard>

        {/* Recommendations */}
        <SectionHeader title="AI Recommendations" icon="brain" />
        <GradientCard>
          <View style={styles.section}>
            {(risk?.recommendations || [
              'Schedule regular screenings as recommended',
              'Maintain a healthy BMI through diet and exercise',
              'Avoid tobacco and limit alcohol consumption',
              'Stay up to date with vaccinations',
              'Report any new or unusual symptoms promptly',
            ]).map((r: string, i: number) => (
              <View key={i} style={styles.recItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                <Text variant="bodyMedium" style={styles.recText}>{r}</Text>
              </View>
            ))}
          </View>
        </GradientCard>

        {/* Screening Schedule */}
        <SectionHeader title="Next Screenings" icon="calendar-clock" />
        <GradientCard>
          <View style={styles.section}>
            <InfoRow label="Mammogram" value="Due in 3 months" icon="microscope" />
            <InfoRow label="Blood Work" value="Due in 1 month" icon="test-tube" />
            <InfoRow label="Colonoscopy" value="Next year" icon="hospital" />
            <InfoRow label="Skin Check" value="Due in 6 months" icon="human" />
          </View>
        </GradientCard>

        <Button mode="contained" style={styles.assessBtn} buttonColor={colors.primary}
          textColor="#000" icon="refresh" onPress={loadData}>
          Run New Assessment
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  riskCard: { alignItems: 'center', padding: spacing.xl },
  riskScore: { fontSize: 48, fontWeight: '700', marginTop: spacing.md },
  riskBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, marginBottom: spacing.md,
  },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.surface },
  section: { padding: spacing.md },
  recItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  recText: { color: colors.text, marginLeft: spacing.sm, flex: 1 },
  assessBtn: { marginTop: spacing.md, borderRadius: 12 },
});
