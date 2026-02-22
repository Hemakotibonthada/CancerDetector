import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Avatar, List, Switch, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';
import { GradientCard, InfoRow } from '../../components/shared';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <GradientCard>
          <View style={styles.profileHeader}>
            <Avatar.Text size={80}
              label={(user?.full_name || 'P').substring(0, 2).toUpperCase()}
              style={{ backgroundColor: colors.primary + '30' }}
              labelStyle={{ fontSize: 28, color: colors.primary }} />
            <Text variant="headlineSmall" style={[styles.whiteText, { marginTop: 12 }]}>
              {user?.full_name || 'User'}
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 4 }}>
              {user?.email}
            </Text>
            <View style={styles.roleChip}>
              <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
              <Text variant="labelSmall" style={{ color: colors.primary, marginLeft: 4 }}>
                {user?.role?.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* Personal Info */}
        <GradientCard>
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.whiteText, styles.sectionTitle]}>
              Personal Information
            </Text>
            <InfoRow label="Name" value={user?.full_name || 'N/A'} icon="account" />
            <InfoRow label="Email" value={user?.email || 'N/A'} icon="email" />
            <InfoRow label="Phone" value={user?.phone || 'Not set'} icon="phone" />
            <InfoRow label="Role" value={user?.role || 'N/A'} icon="badge-account" />
            <InfoRow label="Member since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} icon="calendar" />
          </View>
        </GradientCard>

        {/* Settings */}
        <GradientCard>
          <View style={styles.section}>
            <Text variant="titleSmall" style={[styles.whiteText, styles.sectionTitle]}>
              Settings
            </Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="bell" size={20} color={colors.textSecondary} />
                <Text variant="bodyMedium" style={[styles.whiteText, { marginLeft: 12 }]}>Notifications</Text>
              </View>
              <Switch value={notifications} onValueChange={setNotifications} color={colors.primary} />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="theme-light-dark" size={20} color={colors.textSecondary} />
                <Text variant="bodyMedium" style={[styles.whiteText, { marginLeft: 12 }]}>Dark Mode</Text>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} color={colors.primary} />
            </View>
            <Divider style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="fingerprint" size={20} color={colors.textSecondary} />
                <Text variant="bodyMedium" style={[styles.whiteText, { marginLeft: 12 }]}>Biometric Login</Text>
              </View>
              <Switch value={biometric} onValueChange={setBiometric} color={colors.primary} />
            </View>
          </View>
        </GradientCard>

        {/* Actions */}
        <GradientCard>
          <View style={styles.section}>
            <List.Item title="Edit Profile" titleStyle={styles.whiteText}
              left={() => <MaterialCommunityIcons name="account-edit" size={24} color={colors.primary} style={{ marginLeft: spacing.md }} />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />}
              onPress={() => {}} />
            <Divider style={styles.divider} />
            <List.Item title="Change Password" titleStyle={styles.whiteText}
              left={() => <MaterialCommunityIcons name="lock-reset" size={24} color={colors.warning} style={{ marginLeft: spacing.md }} />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />}
              onPress={() => {}} />
            <Divider style={styles.divider} />
            <List.Item title="Privacy Policy" titleStyle={styles.whiteText}
              left={() => <MaterialCommunityIcons name="shield-lock" size={24} color={colors.info} style={{ marginLeft: spacing.md }} />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />}
              onPress={() => {}} />
            <Divider style={styles.divider} />
            <List.Item title="Help & Support" titleStyle={styles.whiteText}
              left={() => <MaterialCommunityIcons name="help-circle" size={24} color={colors.success} style={{ marginLeft: spacing.md }} />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />}
              onPress={() => {}} />
          </View>
        </GradientCard>

        <Button mode="contained" onPress={handleLogout}
          style={styles.logoutButton} contentStyle={styles.logoutContent}
          buttonColor={colors.error} textColor="#fff"
          icon="logout" labelStyle={{ fontWeight: '600' }}>
          Sign Out
        </Button>

        <Text variant="bodySmall" style={styles.version}>CancerGuard AI v1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  whiteText: { color: colors.text },
  profileHeader: { alignItems: 'center', padding: spacing.lg },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: `${colors.primary}15`, borderRadius: 999,
    borderWidth: 1, borderColor: `${colors.primary}30`,
  },
  section: { padding: spacing.md },
  sectionTitle: { fontWeight: '600', marginBottom: spacing.md },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  divider: { backgroundColor: colors.border, marginVertical: 2 },
  logoutButton: { marginTop: spacing.md, borderRadius: borderRadius.md },
  logoutContent: { height: 48 },
  version: { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl },
});
