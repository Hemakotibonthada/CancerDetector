import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions,
  FlatList, TextInput, Modal, RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== Types ====================
interface Workout {
  id: string;
  name: string;
  type: 'walking' | 'yoga' | 'strength' | 'stretching' | 'swimming' | 'cycling' | 'meditation_movement';
  duration: number;
  calories: number;
  intensity: 'low' | 'moderate' | 'high';
  cancerSafe: boolean;
  description: string;
  exercises: Exercise[];
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  restrictions: string[];
}

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restSeconds: number;
  description: string;
  modificationForCancer?: string;
}

interface ActivityLog {
  id: string;
  date: string;
  type: string;
  duration: number;
  calories: number;
  heartRateAvg: number;
  heartRateMax: number;
  steps: number;
  distance?: number;
  mood: number;
  fatigueLevel: number;
  painLevel: number;
  notes: string;
}

interface FitnessGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  icon: string;
  color: string;
}

// ==================== Progress Circle ====================
const ProgressCircle: React.FC<{
  progress: number;
  size: number;
  color: string;
  label: string;
  value: string;
}> = ({ progress, size, color, label, value }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, { toValue: progress, duration: 1200, useNativeDriver: false }).start();
  }, [progress]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 4, borderColor: color + '30',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          position: 'absolute', width: size, height: size, borderRadius: size / 2,
          borderWidth: 4, borderColor: color,
          borderTopColor: progress > 0.25 ? color : 'transparent',
          borderRightColor: progress > 0.5 ? color : 'transparent',
          borderBottomColor: progress > 0.75 ? color : 'transparent',
          borderLeftColor: progress > 0 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }} />
        <Text style={{ fontSize: size / 4, fontWeight: '800', color }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{label}</Text>
    </View>
  );
};

// ==================== Workout Card ====================
const WorkoutCard: React.FC<{
  workout: Workout;
  onPress: () => void;
  index: number;
}> = ({ workout, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: index * 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: index * 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const getTypeIcon = () => {
    switch (workout.type) {
      case 'walking': return 'walk';
      case 'yoga': return 'yoga';
      case 'strength': return 'weight-lifter';
      case 'stretching': return 'human-handsup';
      case 'swimming': return 'swim';
      case 'cycling': return 'bike';
      case 'meditation_movement': return 'meditation';
    }
  };

  const getTypeColor = () => {
    switch (workout.type) {
      case 'walking': return '#4CAF50';
      case 'yoga': return '#9C27B0';
      case 'strength': return '#F44336';
      case 'stretching': return '#FF9800';
      case 'swimming': return '#2196F3';
      case 'cycling': return '#00BCD4';
      case 'meditation_movement': return '#673AB7';
    }
  };

  const getIntensityColor = () => {
    switch (workout.intensity) {
      case 'low': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'high': return '#F44336';
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.workoutCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.workoutCardHeader}>
          <View style={[styles.workoutTypeIcon, { backgroundColor: getTypeColor() + '15' }]}>
            <MaterialCommunityIcons name={getTypeIcon() as any} size={28} color={getTypeColor()} />
          </View>
          <View style={styles.workoutCardInfo}>
            <Text style={styles.workoutCardTitle}>{workout.name}</Text>
            <Text style={styles.workoutCardDescription} numberOfLines={2}>{workout.description}</Text>
          </View>
          {workout.cancerSafe && (
            <View style={styles.cancerSafeBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#4CAF50" />
            </View>
          )}
        </View>

        <View style={styles.workoutCardMeta}>
          <View style={styles.workoutMetaItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.workoutMetaText}>{workout.duration} min</Text>
          </View>
          <View style={styles.workoutMetaItem}>
            <MaterialCommunityIcons name="fire" size={14} color="#FF5722" />
            <Text style={styles.workoutMetaText}>{workout.calories} cal</Text>
          </View>
          <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor() + '15' }]}>
            <Text style={[styles.intensityText, { color: getIntensityColor() }]}>
              {workout.intensity}
            </Text>
          </View>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{workout.difficulty}</Text>
          </View>
        </View>

        {workout.benefits.length > 0 && (
          <View style={styles.benefitTags}>
            {workout.benefits.slice(0, 3).map((benefit, idx) => (
              <View key={idx} style={styles.benefitTag}>
                <Text style={styles.benefitTagText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {workout.restrictions.length > 0 && (
          <View style={styles.restrictionNote}>
            <Ionicons name="alert-circle" size={14} color="#FF9800" />
            <Text style={styles.restrictionText}>
              {workout.restrictions[0]}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== Activity Log Card ====================
const ActivityLogCard: React.FC<{ log: ActivityLog }> = ({ log }) => {
  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[Math.min(mood - 1, 4)];
  };

  return (
    <View style={styles.activityLogCard}>
      <View style={styles.activityLogHeader}>
        <View>
          <Text style={styles.activityLogDate}>{log.date}</Text>
          <Text style={styles.activityLogType}>{log.type}</Text>
        </View>
        <Text style={styles.activityLogMood}>{getMoodEmoji(log.mood)}</Text>
      </View>

      <View style={styles.activityLogStats}>
        <View style={styles.activityLogStat}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#2196F3" />
          <Text style={styles.activityLogStatValue}>{log.duration} min</Text>
        </View>
        <View style={styles.activityLogStat}>
          <MaterialCommunityIcons name="fire" size={16} color="#FF5722" />
          <Text style={styles.activityLogStatValue}>{log.calories} cal</Text>
        </View>
        <View style={styles.activityLogStat}>
          <MaterialCommunityIcons name="heart-pulse" size={16} color="#F44336" />
          <Text style={styles.activityLogStatValue}>{log.heartRateAvg} bpm</Text>
        </View>
        <View style={styles.activityLogStat}>
          <MaterialCommunityIcons name="shoe-print" size={16} color="#4CAF50" />
          <Text style={styles.activityLogStatValue}>{log.steps.toLocaleString()}</Text>
        </View>
      </View>

      {/* Fatigue & Pain levels */}
      <View style={styles.healthIndicators}>
        <View style={styles.healthIndicator}>
          <Text style={styles.healthIndicatorLabel}>Fatigue</Text>
          <View style={styles.healthIndicatorBar}>
            <View style={[styles.healthIndicatorFill, {
              width: `${log.fatigueLevel * 10}%`,
              backgroundColor: log.fatigueLevel > 7 ? '#F44336' : log.fatigueLevel > 4 ? '#FF9800' : '#4CAF50',
            }]} />
          </View>
          <Text style={styles.healthIndicatorValue}>{log.fatigueLevel}/10</Text>
        </View>
        <View style={styles.healthIndicator}>
          <Text style={styles.healthIndicatorLabel}>Pain</Text>
          <View style={styles.healthIndicatorBar}>
            <View style={[styles.healthIndicatorFill, {
              width: `${log.painLevel * 10}%`,
              backgroundColor: log.painLevel > 7 ? '#F44336' : log.painLevel > 4 ? '#FF9800' : '#4CAF50',
            }]} />
          </View>
          <Text style={styles.healthIndicatorValue}>{log.painLevel}/10</Text>
        </View>
      </View>

      {log.notes && (
        <Text style={styles.activityLogNotes}>{log.notes}</Text>
      )}
    </View>
  );
};

// ==================== Main ExerciseTrackerScreen ====================
const ExerciseTrackerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'workouts' | 'activity' | 'goals' | 'plans'>('workouts');
  const headerAnim = useRef(new Animated.Value(0)).current;

  const goals: FitnessGoal[] = useMemo(() => [
    { id: '1', name: 'Steps', target: 8000, current: 5420, unit: 'steps', period: 'daily', icon: 'shoe-print', color: '#4CAF50' },
    { id: '2', name: 'Active Minutes', target: 30, current: 22, unit: 'min', period: 'daily', icon: 'clock-fast', color: '#2196F3' },
    { id: '3', name: 'Calories', target: 300, current: 185, unit: 'cal', period: 'daily', icon: 'fire', color: '#FF5722' },
    { id: '4', name: 'Water', target: 2500, current: 1800, unit: 'ml', period: 'daily', icon: 'cup-water', color: '#00BCD4' },
    { id: '5', name: 'Weekly Workouts', target: 5, current: 3, unit: 'sessions', period: 'weekly', icon: 'dumbbell', color: '#9C27B0' },
    { id: '6', name: 'Monthly Distance', target: 50, current: 28, unit: 'km', period: 'monthly', icon: 'map-marker-distance', color: '#FF9800' },
  ], []);

  const workouts: Workout[] = useMemo(() => [
    {
      id: '1', name: 'Gentle Morning Walk', type: 'walking', duration: 20, calories: 80,
      intensity: 'low', cancerSafe: true, difficulty: 'beginner',
      description: 'Light walking at a comfortable pace, perfect for treatment days',
      benefits: ['Cardiovascular health', 'Mood boost', 'Energy increase'],
      restrictions: ['Stop if experiencing dizziness'],
      exercises: [
        { id: 'e1', name: 'Warm-up stroll', duration: 3, restSeconds: 0, description: '3 min easy pace' },
        { id: 'e2', name: 'Moderate walk', duration: 14, restSeconds: 0, description: 'Comfortable pace' },
        { id: 'e3', name: 'Cool-down', duration: 3, restSeconds: 0, description: 'Slow pace with deep breaths' },
      ],
    },
    {
      id: '2', name: 'Cancer Recovery Yoga', type: 'yoga', duration: 30, calories: 120,
      intensity: 'low', cancerSafe: true, difficulty: 'beginner',
      description: 'Gentle yoga sequence designed specifically for cancer patients',
      benefits: ['Flexibility', 'Stress relief', 'Pain management', 'Better sleep'],
      restrictions: ['Avoid inversions during treatment', 'Modify poses as needed'],
      exercises: [
        { id: 'e4', name: 'Cat-Cow Stretch', sets: 1, reps: 8, restSeconds: 10, description: 'Gentle spine mobilization', modificationForCancer: 'Keep movements small and controlled' },
        { id: 'e5', name: 'Gentle Warrior I', sets: 1, reps: 1, duration: 30, restSeconds: 15, description: 'Modified standing pose', modificationForCancer: 'Use chair for support if needed' },
        { id: 'e6', name: 'Child\'s Pose', sets: 1, reps: 1, duration: 60, restSeconds: 10, description: 'Resting pose for recovery' },
        { id: 'e7', name: 'Savasana', sets: 1, reps: 1, duration: 300, restSeconds: 0, description: 'Deep relaxation' },
      ],
    },
    {
      id: '3', name: 'Light Strength Training', type: 'strength', duration: 25, calories: 150,
      intensity: 'moderate', cancerSafe: true, difficulty: 'intermediate',
      description: 'Resistance exercises to maintain muscle mass during treatment',
      benefits: ['Muscle maintenance', 'Bone strength', 'Metabolism boost'],
      restrictions: ['Avoid heavy weights', 'No exercises causing port site strain'],
      exercises: [
        { id: 'e8', name: 'Wall Push-ups', sets: 3, reps: 10, restSeconds: 30, description: 'Modified push-ups against wall', modificationForCancer: 'Reduce range of motion if tired' },
        { id: 'e9', name: 'Seated Leg Extensions', sets: 3, reps: 12, restSeconds: 30, description: 'Strengthen quadriceps', modificationForCancer: 'Use no weight or light ankle weights' },
        { id: 'e10', name: 'Light Bicep Curls', sets: 3, reps: 10, restSeconds: 30, description: 'Light weights 2-5 lbs' },
        { id: 'e11', name: 'Standing Calf Raises', sets: 2, reps: 15, restSeconds: 20, description: 'Hold chair for balance' },
      ],
    },
    {
      id: '4', name: 'Stretching & Flexibility', type: 'stretching', duration: 15, calories: 40,
      intensity: 'low', cancerSafe: true, difficulty: 'beginner',
      description: 'Full body stretching routine to improve mobility and reduce stiffness',
      benefits: ['Flexibility', 'Range of motion', 'Pain relief'],
      restrictions: ['Gentle stretches only - no bouncing'],
      exercises: [
        { id: 'e12', name: 'Neck Rolls', sets: 1, reps: 5, restSeconds: 10, description: 'Slow, controlled circles' },
        { id: 'e13', name: 'Shoulder Rolls', sets: 1, reps: 10, restSeconds: 10, description: 'Forward and backward' },
        { id: 'e14', name: 'Hamstring Stretch', sets: 1, reps: 1, duration: 30, restSeconds: 10, description: 'Seated or standing' },
        { id: 'e15', name: 'Chest Opener', sets: 1, reps: 1, duration: 30, restSeconds: 10, description: 'Clasp hands behind back' },
      ],
    },
    {
      id: '5', name: 'Gentle Aqua Exercise', type: 'swimming', duration: 30, calories: 200,
      intensity: 'low', cancerSafe: true, difficulty: 'beginner',
      description: 'Water-based exercises that are gentle on joints during recovery',
      benefits: ['Joint-friendly', 'Full body workout', 'Cardiovascular fitness'],
      restrictions: ['Ensure surgical wounds are healed', 'Check with doctor first'],
      exercises: [
        { id: 'e16', name: 'Water Walking', duration: 10, restSeconds: 60, description: 'Walk across pool at waist depth' },
        { id: 'e17', name: 'Arm Circles', sets: 3, reps: 10, restSeconds: 20, description: 'Underwater arm movements' },
        { id: 'e18', name: 'Leg Kicks', sets: 3, reps: 12, restSeconds: 20, description: 'Hold pool edge for support' },
      ],
    },
    {
      id: '6', name: 'Mindful Movement', type: 'meditation_movement', duration: 20, calories: 60,
      intensity: 'low', cancerSafe: true, difficulty: 'beginner',
      description: 'Combining mindfulness with gentle movement for mind-body healing',
      benefits: ['Mind-body connection', 'Stress reduction', 'Inner peace'],
      restrictions: [],
      exercises: [
        { id: 'e19', name: 'Standing Meditation', duration: 5, restSeconds: 0, description: 'Grounded awareness' },
        { id: 'e20', name: 'Tai Chi Flow', duration: 10, restSeconds: 0, description: 'Slow flowing movements' },
        { id: 'e21', name: 'Body Gratitude Scan', duration: 5, restSeconds: 0, description: 'Appreciate each body part' },
      ],
    },
  ], []);

  const activityLogs: ActivityLog[] = useMemo(() => [
    { id: '1', date: 'Feb 26, 2026', type: 'Morning Walk', duration: 25, calories: 100, heartRateAvg: 95, heartRateMax: 110, steps: 3200, distance: 2.1, mood: 4, fatigueLevel: 3, painLevel: 2, notes: 'Felt energetic today, nice weather' },
    { id: '2', date: 'Feb 25, 2026', type: 'Yoga Session', duration: 30, calories: 115, heartRateAvg: 82, heartRateMax: 98, steps: 500, mood: 5, fatigueLevel: 2, painLevel: 1, notes: 'Best session yet, very relaxing' },
    { id: '3', date: 'Feb 24, 2026', type: 'Rest Day', duration: 0, calories: 0, heartRateAvg: 70, heartRateMax: 75, steps: 1200, mood: 3, fatigueLevel: 6, painLevel: 4, notes: 'Treatment day - resting' },
    { id: '4', date: 'Feb 23, 2026', type: 'Light Strength', duration: 20, calories: 130, heartRateAvg: 100, heartRateMax: 118, steps: 800, mood: 4, fatigueLevel: 4, painLevel: 2, notes: 'Good session with light weights' },
    { id: '5', date: 'Feb 22, 2026', type: 'Stretching', duration: 15, calories: 35, heartRateAvg: 78, heartRateMax: 85, steps: 400, mood: 4, fatigueLevel: 3, painLevel: 3, notes: 'Focused on upper body flexibility' },
  ], []);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const renderWorkoutsTab = () => (
    <>
      {/* Today's Summary */}
      <View style={styles.todaySummary}>
        <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todaySummaryGradient}>
          <Text style={styles.todaySummaryTitle}>Today's Activity</Text>
          <View style={styles.todaySummaryCircles}>
            <ProgressCircle progress={0.68} size={70} color="#fff" label="Steps" value="5.4K" />
            <ProgressCircle progress={0.73} size={70} color="#fff" label="Active" value="22m" />
            <ProgressCircle progress={0.62} size={70} color="#fff" label="Cal" value="185" />
          </View>
        </LinearGradient>
      </View>

      {/* Recommended Workouts */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <Text style={styles.sectionSubtitle}>Cancer-safe exercises tailored to your condition</Text>
        {workouts.map((workout, idx) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onPress={() => Alert.alert('Start Workout', `Begin "${workout.name}"?`)}
            index={idx}
          />
        ))}
      </View>
    </>
  );

  const renderActivityTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Activity Log</Text>

      {/* Weekly Overview */}
      <View style={styles.weeklyOverview}>
        <Text style={styles.weeklyOverviewTitle}>This Week</Text>
        <View style={styles.weeklyStatsRow}>
          <View style={styles.weeklyStat}>
            <MaterialCommunityIcons name="shoe-print" size={20} color="#4CAF50" />
            <Text style={styles.weeklyStatValue}>28,500</Text>
            <Text style={styles.weeklyStatLabel}>Steps</Text>
          </View>
          <View style={styles.weeklyStat}>
            <MaterialCommunityIcons name="fire" size={20} color="#FF5722" />
            <Text style={styles.weeklyStatValue}>380</Text>
            <Text style={styles.weeklyStatLabel}>Calories</Text>
          </View>
          <View style={styles.weeklyStat}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#2196F3" />
            <Text style={styles.weeklyStatValue}>90</Text>
            <Text style={styles.weeklyStatLabel}>Minutes</Text>
          </View>
          <View style={styles.weeklyStat}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#9C27B0" />
            <Text style={styles.weeklyStatValue}>4</Text>
            <Text style={styles.weeklyStatLabel}>Workouts</Text>
          </View>
        </View>
      </View>

      {activityLogs.map((log) => (
        <ActivityLogCard key={log.id} log={log} />
      ))}
    </View>
  );

  const renderGoalsTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Fitness Goals</Text>
      <Text style={styles.sectionSubtitle}>Personalized goals adapted to your treatment</Text>

      <View style={styles.goalsGrid}>
        {goals.map((goal) => {
          const progress = goal.current / goal.target;
          return (
            <TouchableOpacity key={goal.id} style={styles.goalCard} activeOpacity={0.7}>
              <View style={[styles.goalIconContainer, { backgroundColor: goal.color + '15' }]}>
                <MaterialCommunityIcons name={goal.icon as any} size={24} color={goal.color} />
              </View>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalProgress}>{goal.current} / {goal.target} {goal.unit}</Text>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: goal.color }]} />
              </View>
              <Text style={[styles.goalPercentage, { color: goal.color }]}>
                {Math.round(progress * 100)}%
              </Text>
              <Text style={styles.goalPeriod}>{goal.period}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Achievement Section */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Achievements</Text>
      {[
        { name: 'First Steps', desc: 'Completed your first workout', icon: 'trophy', color: '#FFD700', earned: true },
        { name: 'Week Warrior', desc: '5 workouts in a week', icon: 'shield-star', color: '#4CAF50', earned: true },
        { name: 'Consistency King', desc: '30-day streak', icon: 'crown', color: '#FF9800', earned: false },
        { name: 'Marathon Walker', desc: 'Walk 100km total', icon: 'map-marker-distance', color: '#2196F3', earned: false },
      ].map((achievement, idx) => (
        <View key={idx} style={[styles.achievementCard, !achievement.earned && styles.achievementCardLocked]}>
          <View style={[styles.achievementIcon, { backgroundColor: achievement.earned ? achievement.color + '20' : '#F0F0F0' }]}>
            <MaterialCommunityIcons
              name={achievement.icon as any}
              size={24}
              color={achievement.earned ? achievement.color : '#999'}
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementName, !achievement.earned && styles.achievementNameLocked]}>
              {achievement.name}
            </Text>
            <Text style={styles.achievementDesc}>{achievement.desc}</Text>
          </View>
          {achievement.earned ? (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          ) : (
            <Ionicons name="lock-closed" size={20} color="#999" />
          )}
        </View>
      ))}
    </View>
  );

  const renderPlansTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Exercise Plans</Text>
      
      {[
        {
          name: 'Post-Surgery Recovery Plan',
          weeks: 8, level: 'Beginner', focus: 'Gentle mobility and strength rebuilding',
          phases: [
            { name: 'Phase 1 (Week 1-2)', desc: 'Breathing and gentle mobility' },
            { name: 'Phase 2 (Week 3-4)', desc: 'Light walking and stretching' },
            { name: 'Phase 3 (Week 5-6)', desc: 'Yoga and light strength' },
            { name: 'Phase 4 (Week 7-8)', desc: 'Increased activity and endurance' },
          ],
          color: '#4CAF50',
        },
        {
          name: 'During Chemotherapy Plan',
          weeks: 12, level: 'Adapted', focus: 'Maintain fitness while managing side effects',
          phases: [
            { name: 'Treatment Days', desc: 'Rest and gentle stretching only' },
            { name: 'Recovery Days', desc: 'Light walking 10-15 min' },
            { name: 'Good Days', desc: 'Normal workout routine' },
          ],
          color: '#2196F3',
        },
        {
          name: 'Cancer Survivor Fitness',
          weeks: 16, level: 'Progressive', focus: 'Gradual return to full fitness',
          phases: [
            { name: 'Foundation (Week 1-4)', desc: 'Build baseline fitness' },
            { name: 'Growth (Week 5-8)', desc: 'Increase duration and intensity' },
            { name: 'Strength (Week 9-12)', desc: 'Add resistance training' },
            { name: 'Peak (Week 13-16)', desc: 'Full fitness program' },
          ],
          color: '#FF9800',
        },
      ].map((plan, idx) => (
        <View key={idx} style={styles.planCard}>
          <View style={[styles.planCardBorder, { backgroundColor: plan.color }]} />
          <View style={styles.planCardContent}>
            <Text style={styles.planCardTitle}>{plan.name}</Text>
            <View style={styles.planCardMeta}>
              <Text style={styles.planCardMetaText}>{plan.weeks} weeks</Text>
              <Text style={styles.planCardMetaText}>•</Text>
              <Text style={styles.planCardMetaText}>{plan.level}</Text>
            </View>
            <Text style={styles.planCardFocus}>{plan.focus}</Text>
            
            {plan.phases.map((phase, phaseIdx) => (
              <View key={phaseIdx} style={styles.phaseItem}>
                <View style={[styles.phaseDot, { backgroundColor: plan.color }]} />
                <View>
                  <Text style={styles.phaseName}>{phase.name}</Text>
                  <Text style={styles.phaseDesc}>{phase.desc}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={[styles.startPlanButton, { backgroundColor: plan.color }]}>
              <Text style={styles.startPlanButtonText}>Start Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise</Text>
        <TouchableOpacity>
          <Ionicons name="stats-chart" size={24} color="#667eea" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
        {(['workouts', 'activity', 'goals', 'plans'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#667eea']} />}
      >
        {selectedTab === 'workouts' && renderWorkoutsTab()}
        {selectedTab === 'activity' && renderActivityTab()}
        {selectedTab === 'goals' && renderGoalsTab()}
        {selectedTab === 'plans' && renderPlansTab()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  tabScroll: { maxHeight: 50, marginBottom: 8 },
  tabScrollContent: { paddingHorizontal: 20, gap: 8 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#E8E8E8' },
  tabActive: { backgroundColor: '#667eea' },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  scrollView: { flex: 1 },
  sectionContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: '#999', marginBottom: 16 },
  todaySummary: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  todaySummaryGradient: { padding: 24 },
  todaySummaryTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'center' },
  todaySummaryCircles: { flexDirection: 'row', justifyContent: 'space-around' },
  workoutCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  workoutTypeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  workoutCardInfo: { flex: 1, marginLeft: 12 },
  workoutCardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  workoutCardDescription: { fontSize: 12, color: '#999', marginTop: 4, lineHeight: 18 },
  cancerSafeBadge: { backgroundColor: '#E8F5E9', padding: 4, borderRadius: 8 },
  workoutCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  workoutMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  workoutMetaText: { fontSize: 12, color: '#666' },
  intensityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  intensityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  difficultyBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  difficultyText: { fontSize: 11, color: '#666', fontWeight: '500', textTransform: 'capitalize' },
  benefitTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  benefitTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  benefitTagText: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
  restrictionNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 8, padding: 8, gap: 6 },
  restrictionText: { fontSize: 11, color: '#FF9800', flex: 1 },
  activityLogCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  activityLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  activityLogDate: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  activityLogType: { fontSize: 12, color: '#999', marginTop: 2 },
  activityLogMood: { fontSize: 24 },
  activityLogStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 12 },
  activityLogStat: { alignItems: 'center' },
  activityLogStatValue: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 4 },
  healthIndicators: { gap: 8, marginBottom: 8 },
  healthIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  healthIndicatorLabel: { fontSize: 12, color: '#666', width: 50 },
  healthIndicatorBar: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  healthIndicatorFill: { height: '100%', borderRadius: 3 },
  healthIndicatorValue: { fontSize: 11, color: '#999', width: 30, textAlign: 'right' },
  activityLogNotes: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  weeklyOverview: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  weeklyOverviewTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  weeklyStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weeklyStat: { alignItems: 'center' },
  weeklyStatValue: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 },
  weeklyStatLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  goalIconContainer: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  goalName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E', marginBottom: 4 },
  goalProgress: { fontSize: 11, color: '#999', marginBottom: 8 },
  goalProgressBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  goalProgressFill: { height: '100%', borderRadius: 3 },
  goalPercentage: { fontSize: 16, fontWeight: '800' },
  goalPeriod: { fontSize: 10, color: '#999', textTransform: 'capitalize', marginTop: 2 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  achievementCardLocked: { opacity: 0.6 },
  achievementIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  achievementInfo: { flex: 1, marginLeft: 12 },
  achievementName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  achievementNameLocked: { color: '#999' },
  achievementDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  planCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  planCardBorder: { width: 4 },
  planCardContent: { flex: 1, padding: 16 },
  planCardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  planCardMeta: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  planCardMetaText: { fontSize: 12, color: '#999' },
  planCardFocus: { fontSize: 13, color: '#666', marginBottom: 12 },
  phaseItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  phaseDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  phaseName: { fontSize: 13, fontWeight: '600', color: '#333' },
  phaseDesc: { fontSize: 12, color: '#999' },
  startPlanButton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  startPlanButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default ExerciseTrackerScreen;
