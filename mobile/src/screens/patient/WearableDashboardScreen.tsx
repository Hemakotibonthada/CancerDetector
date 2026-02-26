/**
 * WearableDashboardScreen - Real-time health data from connected wearable devices
 * Displays heart rate, steps, sleep, SpO2, stress, activity tracking with charts
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface WearableDevice {
  id: string;
  name: string;
  brand: 'apple' | 'fitbit' | 'garmin' | 'samsung' | 'google';
  model: string;
  battery: number;
  lastSync: Date;
  connected: boolean;
  firmwareVersion: string;
}

interface HealthMetric {
  id: string;
  name: string;
  icon: string;
  currentValue: number | string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  minToday: number;
  maxToday: number;
  avgToday: number;
  target?: number;
  history: { time: string; value: number }[];
}

interface SleepData {
  totalHours: number;
  deep: number;
  light: number;
  rem: number;
  awake: number;
  score: number;
  bedtime: string;
  wakeTime: string;
  efficiency: number;
}

interface ActivityData {
  steps: number;
  stepsGoal: number;
  calories: number;
  caloriesGoal: number;
  distance: number;
  distanceUnit: string;
  activeMinutes: number;
  activeMinutesGoal: number;
  floors: number;
  exercises: { name: string; duration: string; calories: number; heartRate: number }[];
}

interface StressData {
  currentLevel: number;
  average: number;
  restingPeriods: number;
  highStressPeriods: number;
  bodyBattery: number;
}

type TimeRange = 'today' | 'week' | 'month' | '3months';

// ============================================================================
// Theme
// ============================================================================

const theme = {
  colors: {
    primary: '#1565c0',
    primaryDark: '#0d47a1',
    primaryLight: '#42a5f5',
    secondary: '#00897b',
    accent: '#7b1fa2',
    background: '#f5f7fa',
    surface: '#ffffff',
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#9e9e9e',
    border: '#e0e0e0',
    error: '#d32f2f',
    warning: '#f57c00',
    success: '#388e3c',
    info: '#1976d2',
    heartRate: '#ef5350',
    steps: '#66bb6a',
    sleep: '#7e57c2',
    spo2: '#42a5f5',
    stress: '#ff7043',
    calories: '#ffa726',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
};

// ============================================================================
// Mock Data
// ============================================================================

const mockDevice: WearableDevice = {
  id: 'dev1',
  name: 'Apple Watch Series 9',
  brand: 'apple',
  model: 'Series 9',
  battery: 72,
  lastSync: new Date(Date.now() - 120000),
  connected: true,
  firmwareVersion: '10.2.1',
};

const generateHeartRateHistory = () => {
  const data: { time: string; value: number }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const base = h >= 0 && h < 6 ? 58 : h >= 6 && h < 9 ? 72 : h >= 17 && h < 19 ? 95 : 75;
      data.push({ time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, value: base + Math.floor(Math.random() * 15 - 7) });
    }
  }
  return data;
};

const mockMetrics: HealthMetric[] = [
  {
    id: 'hr', name: 'Heart Rate', icon: '❤️', currentValue: 78, unit: 'bpm',
    status: 'normal', trend: 'stable', minToday: 52, maxToday: 142, avgToday: 72,
    target: 80, history: generateHeartRateHistory(),
  },
  {
    id: 'spo2', name: 'Blood Oxygen', icon: '💨', currentValue: 98, unit: '%',
    status: 'normal', trend: 'stable', minToday: 95, maxToday: 99, avgToday: 97,
    target: 95, history: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: 95 + Math.floor(Math.random() * 4) })),
  },
  {
    id: 'hrv', name: 'HRV', icon: '📊', currentValue: 42, unit: 'ms',
    status: 'normal', trend: 'up', minToday: 28, maxToday: 65, avgToday: 41,
    history: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: 30 + Math.floor(Math.random() * 30) })),
  },
  {
    id: 'resp', name: 'Respiratory Rate', icon: '🫁', currentValue: 16, unit: '/min',
    status: 'normal', trend: 'stable', minToday: 12, maxToday: 22, avgToday: 15,
    history: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: 12 + Math.floor(Math.random() * 8) })),
  },
  {
    id: 'temp', name: 'Wrist Temp', icon: '🌡️', currentValue: '98.4', unit: '°F',
    status: 'normal', trend: 'stable', minToday: 97.2, maxToday: 99.0, avgToday: 98.3,
    history: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: 97 + Math.random() * 2 })),
  },
];

const mockSleep: SleepData = {
  totalHours: 7.5, deep: 1.8, light: 3.2, rem: 1.5, awake: 1.0,
  score: 82, bedtime: '10:45 PM', wakeTime: '6:15 AM', efficiency: 87,
};

const mockActivity: ActivityData = {
  steps: 8432, stepsGoal: 10000, calories: 1842, caloriesGoal: 2200,
  distance: 3.8, distanceUnit: 'miles', activeMinutes: 42, activeMinutesGoal: 60, floors: 8,
  exercises: [
    { name: 'Morning Walk', duration: '28 min', calories: 180, heartRate: 105 },
    { name: 'Yoga', duration: '20 min', calories: 95, heartRate: 88 },
    { name: 'Cycling', duration: '15 min', calories: 165, heartRate: 128 },
  ],
};

const mockStress: StressData = {
  currentLevel: 35, average: 42, restingPeriods: 4, highStressPeriods: 2, bodyBattery: 68,
};

// ============================================================================
// Sub-Components
// ============================================================================

const DeviceStatusBar: React.FC<{ device: WearableDevice }> = ({ device }) => {
  const syncAgo = Math.floor((Date.now() - device.lastSync.getTime()) / 60000);

  const brandIcons: Record<string, string> = {
    apple: '⌚',
    fitbit: '⌚',
    garmin: '⌚',
    samsung: '⌚',
    google: '⌚',
  };

  return (
    <View style={styles.deviceBar}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceIcon}>{brandIcons[device.brand]}</Text>
        <View>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceSync}>Synced {syncAgo} min ago</Text>
        </View>
      </View>
      <View style={styles.deviceRight}>
        <View style={styles.batteryContainer}>
          <View style={[styles.batteryFill, { width: `${device.battery}%`, backgroundColor: device.battery > 20 ? theme.colors.success : theme.colors.error }]} />
        </View>
        <Text style={styles.batteryText}>{device.battery}%</Text>
        <View style={[styles.connectionDot, { backgroundColor: device.connected ? theme.colors.success : theme.colors.error }]} />
      </View>
    </View>
  );
};

const CircularProgress: React.FC<{
  value: number; max: number; size: number; color: string; icon: string; label: string; unit: string;
}> = ({ value, max, size, color, icon, label, unit }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, { toValue: percentage, useNativeDriver: false, friction: 8 }).start();
  }, [percentage]);

  return (
    <View style={[styles.circularContainer, { width: size + 20 }]}>
      <View style={[styles.circularOuter, { width: size, height: size, borderRadius: size / 2, borderColor: color + '30' }]}>
        <View style={[styles.circularInner, { width: size - 12, height: size - 12, borderRadius: (size - 12) / 2 }]}>
          <Text style={styles.circularIcon}>{icon}</Text>
          <Text style={[styles.circularValue, { color }]}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
        </View>
      </View>
      <Text style={styles.circularLabel}>{label}</Text>
      <Text style={styles.circularUnit}>{value.toLocaleString()}/{max.toLocaleString()} {unit}</Text>
    </View>
  );
};

const MiniChart: React.FC<{ data: { time: string; value: number }[]; color: string; height?: number }> = ({
  data,
  color,
  height = 60,
}) => {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Show only last 24 points for readability
  const displayData = data.slice(-24);
  const barWidth = (SCREEN_WIDTH - 80) / displayData.length;

  return (
    <View style={[styles.miniChart, { height }]}>
      <View style={styles.miniChartBars}>
        {displayData.map((point, i) => {
          const barHeight = ((point.value - min) / range) * (height - 10) + 5;
          return (
            <View
              key={i}
              style={[
                styles.miniChartBar,
                {
                  height: barHeight,
                  width: Math.max(barWidth - 2, 2),
                  backgroundColor: color + (i === displayData.length - 1 ? 'ff' : '60'),
                  borderRadius: 2,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const MetricCard: React.FC<{ metric: HealthMetric }> = ({ metric }) => {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const statusColors: Record<string, string> = {
    normal: theme.colors.success,
    warning: theme.colors.warning,
    critical: theme.colors.error,
  };

  const trendIcons: Record<string, string> = { up: '↑', down: '↓', stable: '→' };
  const metricColors: Record<string, string> = {
    hr: theme.colors.heartRate,
    spo2: theme.colors.spo2,
    hrv: theme.colors.accent,
    resp: theme.colors.info,
    temp: theme.colors.warning,
  };

  const color = metricColors[metric.id] || theme.colors.primary;

  return (
    <Animated.View style={[styles.metricCard, { opacity: fadeAnim }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.metricHeader}>
          <View style={styles.metricLeft}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <View>
              <Text style={styles.metricName}>{metric.name}</Text>
              <View style={styles.metricStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColors[metric.status] }]} />
                <Text style={[styles.statusText, { color: statusColors[metric.status] }]}>
                  {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.metricRight}>
            <View style={styles.metricValueRow}>
              <Text style={[styles.metricValue, { color }]}>{metric.currentValue}</Text>
              <Text style={styles.metricUnit}>{metric.unit}</Text>
            </View>
            <Text style={[styles.metricTrend, { color: statusColors[metric.status] }]}>
              {trendIcons[metric.trend]}
            </Text>
          </View>
        </View>

        <MiniChart data={metric.history} color={color} />

        {expanded && (
          <View style={styles.metricDetails}>
            <View style={styles.metricStatsRow}>
              <View style={styles.metricStat}>
                <Text style={styles.metricStatLabel}>Min</Text>
                <Text style={styles.metricStatValue}>{metric.minToday}</Text>
              </View>
              <View style={styles.metricStat}>
                <Text style={styles.metricStatLabel}>Avg</Text>
                <Text style={[styles.metricStatValue, { color }]}>{metric.avgToday}</Text>
              </View>
              <View style={styles.metricStat}>
                <Text style={styles.metricStatLabel}>Max</Text>
                <Text style={styles.metricStatValue}>{metric.maxToday}</Text>
              </View>
              {metric.target && (
                <View style={styles.metricStat}>
                  <Text style={styles.metricStatLabel}>Target</Text>
                  <Text style={styles.metricStatValue}>{metric.target}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SleepCard: React.FC<{ sleep: SleepData }> = ({ sleep }) => {
  const phases = [
    { name: 'Deep', hours: sleep.deep, color: '#3949ab', icon: '🌊' },
    { name: 'Light', hours: sleep.light, color: '#42a5f5', icon: '💤' },
    { name: 'REM', hours: sleep.rem, color: '#7e57c2', icon: '🎯' },
    { name: 'Awake', hours: sleep.awake, color: '#ef5350', icon: '👁️' },
  ];

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>😴</Text>
        <Text style={styles.sectionTitle}>Sleep Analysis</Text>
        <View style={[styles.scoreBadge, { backgroundColor: sleep.score >= 80 ? theme.colors.success + '20' : theme.colors.warning + '20' }]}>
          <Text style={[styles.scoreBadgeText, { color: sleep.score >= 80 ? theme.colors.success : theme.colors.warning }]}>
            Score: {sleep.score}
          </Text>
        </View>
      </View>

      <View style={styles.sleepSummary}>
        <View style={styles.sleepMainStat}>
          <Text style={styles.sleepHours}>{sleep.totalHours.toFixed(1)}</Text>
          <Text style={styles.sleepHoursUnit}>hours</Text>
        </View>
        <View style={styles.sleepTimes}>
          <Text style={styles.sleepTimeLabel}>🌙 {sleep.bedtime}</Text>
          <Text style={styles.sleepTimeLabel}>☀️ {sleep.wakeTime}</Text>
          <Text style={styles.sleepTimeLabel}>📊 {sleep.efficiency}% efficient</Text>
        </View>
      </View>

      {/* Sleep phases bar */}
      <View style={styles.sleepPhaseBar}>
        {phases.map((phase, i) => (
          <View
            key={i}
            style={[
              styles.sleepPhaseSegment,
              {
                width: `${(phase.hours / sleep.totalHours) * 100}%`,
                backgroundColor: phase.color,
                borderTopLeftRadius: i === 0 ? 6 : 0,
                borderBottomLeftRadius: i === 0 ? 6 : 0,
                borderTopRightRadius: i === phases.length - 1 ? 6 : 0,
                borderBottomRightRadius: i === phases.length - 1 ? 6 : 0,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.sleepPhaseLegend}>
        {phases.map((phase, i) => (
          <View key={i} style={styles.sleepPhaseItem}>
            <Text style={styles.sleepPhaseIcon}>{phase.icon}</Text>
            <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
            <Text style={styles.phaseName}>{phase.name}</Text>
            <Text style={styles.phaseHours}>{phase.hours.toFixed(1)}h</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ActivityCard: React.FC<{ activity: ActivityData }> = ({ activity }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>🏃</Text>
      <Text style={styles.sectionTitle}>Activity Summary</Text>
    </View>

    <View style={styles.activityRings}>
      <CircularProgress value={activity.steps} max={activity.stepsGoal} size={80} color={theme.colors.steps} icon="👟" label="Steps" unit="" />
      <CircularProgress value={activity.calories} max={activity.caloriesGoal} size={80} color={theme.colors.calories} icon="🔥" label="Calories" unit="kcal" />
      <CircularProgress value={activity.activeMinutes} max={activity.activeMinutesGoal} size={80} color={theme.colors.primary} icon="⚡" label="Active" unit="min" />
    </View>

    <View style={styles.activityStats}>
      <View style={styles.activityStatItem}>
        <Text style={styles.activityStatIcon}>📏</Text>
        <Text style={styles.activityStatValue}>{activity.distance}</Text>
        <Text style={styles.activityStatUnit}>{activity.distanceUnit}</Text>
      </View>
      <View style={styles.activityStatItem}>
        <Text style={styles.activityStatIcon}>🏢</Text>
        <Text style={styles.activityStatValue}>{activity.floors}</Text>
        <Text style={styles.activityStatUnit}>floors</Text>
      </View>
    </View>

    {activity.exercises.length > 0 && (
      <View style={styles.exerciseList}>
        <Text style={styles.exerciseTitle}>Today's Exercises</Text>
        {activity.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseItem}>
            <View style={styles.exerciseLeft}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseDuration}>{ex.duration}</Text>
            </View>
            <View style={styles.exerciseRight}>
              <Text style={styles.exerciseCalories}>🔥 {ex.calories}</Text>
              <Text style={styles.exerciseHR}>❤️ {ex.heartRate} bpm</Text>
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);

const StressCard: React.FC<{ stress: StressData }> = ({ stress }) => {
  const stressLevel = stress.currentLevel < 30 ? 'Low' : stress.currentLevel < 60 ? 'Moderate' : 'High';
  const stressColor = stress.currentLevel < 30 ? theme.colors.success : stress.currentLevel < 60 ? theme.colors.warning : theme.colors.error;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>🧘</Text>
        <Text style={styles.sectionTitle}>Stress & Recovery</Text>
      </View>

      <View style={styles.stressMain}>
        <View style={styles.stressGauge}>
          <Text style={[styles.stressValue, { color: stressColor }]}>{stress.currentLevel}</Text>
          <Text style={[styles.stressLabel, { color: stressColor }]}>{stressLevel}</Text>
          <View style={styles.stressBarBg}>
            <View style={[styles.stressBarFill, { width: `${stress.currentLevel}%`, backgroundColor: stressColor }]} />
          </View>
        </View>

        <View style={styles.bodyBattery}>
          <Text style={styles.bodyBatteryLabel}>Body Battery</Text>
          <Text style={styles.bodyBatteryValue}>{stress.bodyBattery}%</Text>
          <View style={styles.bodyBatteryBar}>
            <View style={[styles.bodyBatteryFill, { width: `${stress.bodyBattery}%`, backgroundColor: stress.bodyBattery > 50 ? theme.colors.success : theme.colors.warning }]} />
          </View>
        </View>
      </View>

      <View style={styles.stressStats}>
        <View style={styles.stressStat}>
          <Text style={styles.stressStatValue}>{stress.average}</Text>
          <Text style={styles.stressStatLabel}>Avg Level</Text>
        </View>
        <View style={styles.stressStat}>
          <Text style={[styles.stressStatValue, { color: theme.colors.success }]}>{stress.restingPeriods}</Text>
          <Text style={styles.stressStatLabel}>Rest Periods</Text>
        </View>
        <View style={styles.stressStat}>
          <Text style={[styles.stressStatValue, { color: theme.colors.error }]}>{stress.highStressPeriods}</Text>
          <Text style={styles.stressStatLabel}>High Stress</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// Main Screen
// ============================================================================

const WearableDashboardScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const headerScale = scrollY.interpolate({
    inputRange: [-50, 0],
    outputRange: [1.1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Device Status */}
        <Animated.View style={{ transform: [{ scale: headerScale }] }}>
          <DeviceStatusBar device={mockDevice} />
        </Animated.View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['today', 'week', 'month', '3months'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeButton, timeRange === range && styles.timeRangeActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                {range === 'today' ? 'Today' : range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : '90 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Health Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.mainSectionTitle}>Real-Time Vitals</Text>
          {mockMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </View>

        {/* Sleep */}
        <SleepCard sleep={mockSleep} />

        {/* Activity */}
        <ActivityCard activity={mockActivity} />

        {/* Stress */}
        <StressCard stress={mockStress} />

        {/* Alerts Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={styles.sectionTitle}>Health Alerts</Text>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: theme.colors.warning }]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>Elevated resting heart rate detected (82 bpm avg, above your baseline of 68 bpm)</Text>
              <Text style={styles.alertTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: theme.colors.info }]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>You've been inactive for 2 hours. Time for a walk!</Text>
              <Text style={styles.alertTime}>45 min ago</Text>
            </View>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: theme.colors.success }]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>Great sleep last night! Your deep sleep was 20% above your monthly average.</Text>
              <Text style={styles.alertTime}>6 hours ago</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Sync', 'Manual sync initiated...')}>
            <Text style={styles.quickActionIcon}>🔄</Text>
            <Text style={styles.quickActionText}>Sync Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Share', 'Share health data with your doctor?')}>
            <Text style={styles.quickActionIcon}>👨‍⚕️</Text>
            <Text style={styles.quickActionText}>Share with Doctor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Export', 'Export health data as PDF?')}>
            <Text style={styles.quickActionIcon}>📄</Text>
            <Text style={styles.quickActionText}>Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Settings', 'Wearable settings coming soon')}>
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 40 },

  // Device Bar
  deviceBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.colors.surface, margin: theme.spacing.md,
    marginTop: Platform.OS === 'ios' ? 60 : 16,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.lg,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceIcon: { fontSize: 28 },
  deviceName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  deviceSync: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  deviceRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batteryContainer: { width: 30, height: 14, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  batteryFill: { height: '100%', borderRadius: 3 },
  batteryText: { fontSize: 11, color: theme.colors.textSecondary },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },

  // Time Range
  timeRangeContainer: {
    flexDirection: 'row', marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: 4,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  timeRangeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.borderRadius.sm },
  timeRangeActive: { backgroundColor: theme.colors.primary },
  timeRangeText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  timeRangeTextActive: { color: '#fff' },

  // Metrics Section
  metricsSection: { paddingHorizontal: theme.spacing.md },
  mainSectionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },

  // Metric Card
  metricCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { fontSize: 22 },
  metricName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  metricStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  metricRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  metricValue: { fontSize: 24, fontWeight: '800' },
  metricUnit: { fontSize: 12, color: theme.colors.textSecondary },
  metricTrend: { fontSize: 16, fontWeight: '700' },
  metricDetails: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  metricStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metricStat: { alignItems: 'center' },
  metricStatLabel: { fontSize: 11, color: theme.colors.textLight },
  metricStatValue: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginTop: 2 },

  // Mini Chart
  miniChart: { marginTop: 4, justifyContent: 'flex-end' },
  miniChartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' },
  miniChartBar: {},

  // Section Card
  sectionCard: {
    backgroundColor: theme.colors.surface, margin: theme.spacing.md,
    padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, flex: 1 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  scoreBadgeText: { fontSize: 12, fontWeight: '700' },

  // Sleep
  sleepSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sleepMainStat: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  sleepHours: { fontSize: 40, fontWeight: '800', color: theme.colors.accent },
  sleepHoursUnit: { fontSize: 16, color: theme.colors.textSecondary },
  sleepTimes: { gap: 4 },
  sleepTimeLabel: { fontSize: 13, color: theme.colors.textSecondary },
  sleepPhaseBar: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' },
  sleepPhaseSegment: { height: '100%' },
  sleepPhaseLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  sleepPhaseItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sleepPhaseIcon: { fontSize: 12 },
  phaseDot: { width: 8, height: 8, borderRadius: 4 },
  phaseName: { fontSize: 11, color: theme.colors.textSecondary },
  phaseHours: { fontSize: 11, fontWeight: '600', color: theme.colors.text },

  // Activity
  activityRings: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  circularContainer: { alignItems: 'center' },
  circularOuter: { borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  circularInner: { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
  circularIcon: { fontSize: 16 },
  circularValue: { fontSize: 16, fontWeight: '800' },
  circularLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.text, marginTop: 6 },
  circularUnit: { fontSize: 10, color: theme.colors.textLight },
  activityStats: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 16 },
  activityStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activityStatIcon: { fontSize: 16 },
  activityStatValue: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  activityStatUnit: { fontSize: 12, color: theme.colors.textSecondary },
  exerciseList: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  exerciseTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  exerciseItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  exerciseLeft: {},
  exerciseName: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  exerciseDuration: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  exerciseRight: { alignItems: 'flex-end' },
  exerciseCalories: { fontSize: 12, color: theme.colors.calories },
  exerciseHR: { fontSize: 12, color: theme.colors.heartRate, marginTop: 2 },

  // Stress
  stressMain: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stressGauge: { alignItems: 'center' },
  stressValue: { fontSize: 36, fontWeight: '800' },
  stressLabel: { fontSize: 14, fontWeight: '600' },
  stressBarBg: { width: 100, height: 6, backgroundColor: theme.colors.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  stressBarFill: { height: '100%', borderRadius: 3 },
  bodyBattery: { alignItems: 'center' },
  bodyBatteryLabel: { fontSize: 14, color: theme.colors.textSecondary },
  bodyBatteryValue: { fontSize: 32, fontWeight: '800', color: theme.colors.text },
  bodyBatteryBar: { width: 80, height: 6, backgroundColor: theme.colors.border, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  bodyBatteryFill: { height: '100%', borderRadius: 3 },
  stressStats: { flexDirection: 'row', justifyContent: 'space-around' },
  stressStat: { alignItems: 'center' },
  stressStatValue: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  stressStatLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },

  // Alerts
  alertItem: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  alertDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  alertContent: { flex: 1 },
  alertText: { fontSize: 13, color: theme.colors.text, lineHeight: 19 },
  alertTime: { fontSize: 11, color: theme.colors.textLight, marginTop: 4 },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap', padding: theme.spacing.md, gap: 12,
  },
  quickActionButton: {
    width: (SCREEN_WIDTH - 44) / 2, backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md, padding: 16, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  quickActionIcon: { fontSize: 28, marginBottom: 8 },
  quickActionText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
});

export default WearableDashboardScreen;
