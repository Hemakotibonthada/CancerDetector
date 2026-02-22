import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { GradientCard, SectionHeader, InfoRow } from '../../components/shared';

export default function TelehealthScreen() {
  const [inCall, setInCall] = useState(false);

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <GradientCard>
          <View style={styles.centerCard}>
            <MaterialCommunityIcons name="video" size={64} color={colors.primary} />
            <Text variant="headlineSmall" style={{ color: colors.text, marginTop: spacing.md }}>
              Telehealth
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
              Connect with your healthcare provider through secure video consultations.
            </Text>
          </View>
        </GradientCard>

        <SectionHeader title="Upcoming Sessions" icon="calendar-clock" />
        <GradientCard>
          <View style={styles.section}>
            <InfoRow label="Next Session" value="No upcoming sessions" icon="video" />
          </View>
        </GradientCard>

        <SectionHeader title="Quick Connect" icon="phone" />
        <View style={styles.actionRow}>
          <GradientCard>
            <View style={styles.actionItem}>
              <MaterialCommunityIcons name="video" size={32} color="#7c4dff" />
              <Text variant="bodyMedium" style={[styles.whiteText, { marginTop: 8 }]}>Video Call</Text>
              <Button mode="contained" compact style={styles.actionBtn}
                buttonColor="#7c4dff" textColor="#fff" onPress={() => setInCall(true)}>
                Start
              </Button>
            </View>
          </GradientCard>
          <GradientCard>
            <View style={styles.actionItem}>
              <MaterialCommunityIcons name="phone" size={32} color={colors.success} />
              <Text variant="bodyMedium" style={[styles.whiteText, { marginTop: 8 }]}>Voice Call</Text>
              <Button mode="contained" compact style={styles.actionBtn}
                buttonColor={colors.success} textColor="#fff" onPress={() => {}}>
                Call
              </Button>
            </View>
          </GradientCard>
        </View>

        <SectionHeader title="Past Sessions" icon="history" />
        <GradientCard>
          <View style={styles.section}>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', padding: spacing.lg }}>
              No past sessions yet. Your telehealth history will appear here.
            </Text>
          </View>
        </GradientCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  whiteText: { color: colors.text },
  centerCard: { alignItems: 'center', padding: spacing.xl },
  section: { padding: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionItem: { alignItems: 'center', padding: spacing.lg, flex: 1 },
  actionBtn: { marginTop: spacing.sm, borderRadius: 8 },
});
