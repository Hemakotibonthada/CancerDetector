import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView, RefreshControl } from 'react-native';
import {
  Card, Text, Chip, IconButton, ActivityIndicator, Divider, Surface, Badge,
  Button, FAB, Searchbar, Avatar, ProgressBar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Gradient Card ──────────────────────────────────────────
interface GradientCardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export function GradientCard({ children, style, onPress }: GradientCardProps) {
  return (
    <Card style={[styles.gradientCard, style]} onPress={onPress} mode="contained">
      <LinearGradient
        colors={['#1e1e3a', '#252550']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientInner}
      >
        {children}
      </LinearGradient>
    </Card>
  );
}

// ─── Stat Card ──────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, color, trend, onPress }: StatCardProps) {
  return (
    <GradientCard style={styles.statCard} onPress={onPress}>
      <View style={styles.statContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <Text variant="headlineSmall" style={[styles.statValue, { color }]}>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.statLabel}>
          {label}
        </Text>
        {trend && (
          <Text variant="labelSmall" style={{ color: trend.startsWith('+') ? colors.success : colors.error, marginTop: 2 }}>
            {trend}
          </Text>
        )}
      </View>
    </GradientCard>
  );
}

// ─── Status Chip ────────────────────────────────────────────
interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusColors: Record<string, string> = {
  active: colors.success,
  scheduled: colors.info,
  completed: colors.success,
  cancelled: colors.error,
  critical: colors.error,
  pending: colors.warning,
  in_progress: colors.info,
  admitted: colors.info,
  discharged: colors.textSecondary,
  available: colors.success,
  busy: colors.warning,
  on_leave: colors.textSecondary,
  occupied: colors.warning,
  maintenance: colors.error,
  reserved: colors.info,
  normal: colors.success,
  low: colors.warning,
  high: colors.error,
  warning: colors.warning,
  paused: colors.warning,
  outpatient: colors.primary,
  routine: colors.info,
  urgent: colors.warning,
  stat: colors.error,
  healthy: colors.success,
  inactive: colors.textSecondary,
};

export function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const chipColor = statusColors[status] || colors.textSecondary;
  return (
    <Chip
      mode="flat"
      compact={size === 'small'}
      style={[styles.statusChip, { backgroundColor: `${chipColor}25`, borderColor: chipColor }]}
      textStyle={{ color: chipColor, fontSize: size === 'small' ? 11 : 13, fontWeight: '600' }}
    >
      {status.replace(/_/g, ' ').toUpperCase()}
    </Chip>
  );
}

// ─── List Item Card ─────────────────────────────────────────
interface ListItemCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon: string;
  iconColor?: string;
  status?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
}

export function ListItemCard({
  title, subtitle, description, icon, iconColor = colors.primary,
  status, rightContent, onPress,
}: ListItemCardProps) {
  return (
    <GradientCard style={styles.listItemCard} onPress={onPress}>
      <View style={styles.listItemContent}>
        <View style={[styles.listItemIcon, { backgroundColor: `${iconColor}20` }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.listItemText}>
          <Text variant="titleSmall" style={styles.whiteText} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={styles.secondaryText} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {description && (
            <Text variant="bodySmall" style={styles.tertiaryText} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
        <View style={styles.listItemRight}>
          {status && <StatusChip status={status} />}
          {rightContent}
        </View>
      </View>
    </GradientCard>
  );
}

// ─── Section Header ─────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: string;
}

export function SectionHeader({ title, action, onAction, icon }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon && <MaterialCommunityIcons name={icon as any} size={20} color={colors.primary} />}
        <Text variant="titleMedium" style={[styles.whiteText, icon ? { marginLeft: 8 } : {}]}>
          {title}
        </Text>
      </View>
      {action && onAction && (
        <Button mode="text" compact onPress={onAction} textColor={colors.primary}>
          {action}
        </Button>
      )}
    </View>
  );
}

// ─── Empty State ────────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon as any} size={64} color={colors.textTertiary} />
      <Text variant="titleMedium" style={[styles.whiteText, { marginTop: 16 }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.secondaryText, { marginTop: 8, textAlign: 'center' }]}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={{ marginTop: 16 }}
          buttonColor={colors.primary} textColor="#000">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

// ─── Loading Screen ─────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="bodyMedium" style={[styles.secondaryText, { marginTop: 16 }]}>
        Loading...
      </Text>
    </View>
  );
}

// ─── Quick Action Button ────────────────────────────────────
interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

export function QuickAction({ icon, label, color, onPress }: QuickActionProps) {
  return (
    <View style={styles.quickAction}>
      <IconButton
        icon={icon}
        size={28}
        iconColor={color}
        style={[styles.quickActionBtn, { backgroundColor: `${color}20` }]}
        onPress={onPress}
      />
      <Text variant="labelSmall" style={styles.quickActionLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─── Info Row ───────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
}

export function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      {icon && <MaterialCommunityIcons name={icon as any} size={16} color={colors.textTertiary} />}
      <Text variant="bodySmall" style={[styles.tertiaryText, icon ? { marginLeft: 6 } : {}]}>
        {label}:
      </Text>
      <Text variant="bodySmall" style={[styles.whiteText, { marginLeft: 4, flex: 1 }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradientCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
    backgroundColor: 'transparent',
    marginBottom: spacing.sm,
  },
  gradientInner: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCard: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm) / 2,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 28,
  },
  statLabel: {
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statusChip: {
    borderWidth: 1,
    height: 24,
  },
  listItemCard: {
    marginHorizontal: 0,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  listItemText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  whiteText: {
    color: colors.text,
  },
  secondaryText: {
    color: colors.textSecondary,
  },
  tertiaryText: {
    color: colors.textTertiary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  quickAction: {
    alignItems: 'center',
    width: 72,
  },
  quickActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionLabel: {
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
