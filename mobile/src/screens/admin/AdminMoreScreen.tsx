import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Divider, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../theme';
import { GradientCard, SectionHeader } from '../../components/shared';

export default function AdminMoreScreen({ navigation }: any) {
  const { logout } = useAuth();

  const menuSections = [
    {
      title: 'Security & Compliance',
      items: [
        { title: 'Audit Logs', icon: 'history', color: colors.primary },
        { title: 'Security Settings', icon: 'shield-lock', color: colors.error },
        { title: 'HIPAA Compliance', icon: 'certificate', color: colors.success },
        { title: 'Access Control', icon: 'key', color: colors.warning },
      ],
    },
    {
      title: 'Analytics & Reports',
      items: [
        { title: 'Platform Analytics', icon: 'chart-bar', color: colors.primary },
        { title: 'Usage Reports', icon: 'file-chart', color: colors.info },
        { title: 'Performance Metrics', icon: 'speedometer', color: colors.success },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { title: 'System Settings', icon: 'cog', color: colors.textSecondary },
        { title: 'Email Templates', icon: 'email-edit', color: colors.info },
        { title: 'Notification Config', icon: 'bell-cog', color: colors.warning },
        { title: 'API Keys', icon: 'key-variant', color: '#7c4dff' },
      ],
    },
  ];

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {menuSections.map((section, si) => (
          <React.Fragment key={si}>
            <SectionHeader title={section.title} icon="menu" />
            <GradientCard>
              {section.items.map((item, i) => (
                <React.Fragment key={i}>
                  <List.Item title={item.title} titleStyle={{ color: colors.text }}
                    left={() => <MaterialCommunityIcons name={item.icon as any} size={24}
                      color={item.color} style={{ marginLeft: spacing.md, alignSelf: 'center' }} />}
                    right={() => <MaterialCommunityIcons name="chevron-right" size={24}
                      color={colors.textTertiary} style={{ alignSelf: 'center' }} />}
                    onPress={() => {}} />
                  {i < section.items.length - 1 && <Divider style={{ backgroundColor: colors.border }} />}
                </React.Fragment>
              ))}
            </GradientCard>
          </React.Fragment>
        ))}

        <Button mode="contained" onPress={() => {
          Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
          ]);
        }} style={styles.logoutBtn} buttonColor={colors.error} textColor="#fff" icon="logout">
          Sign Out
        </Button>

        <Text variant="bodySmall" style={styles.version}>CancerGuard AI Admin v1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  logoutBtn: { marginTop: spacing.lg, borderRadius: 12 },
  version: { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl },
});
