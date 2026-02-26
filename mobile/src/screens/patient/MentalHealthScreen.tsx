import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== Types ====================
interface MoodEntry {
  id: string;
  mood: number;
  label: string;
  emoji: string;
  note: string;
  timestamp: string;
  activities: string[];
  sleepHours: number;
  painLevel: number;
  anxietyLevel: number;
  energyLevel: number;
}

interface TherapySession {
  id: string;
  therapistName: string;
  type: 'individual' | 'group' | 'family' | 'online';
  date: string;
  time: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

interface MeditationExercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: 'breathing' | 'meditation' | 'visualization' | 'progressive_relaxation' | 'mindfulness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cancerSpecific: boolean;
  audioUrl?: string;
  completedCount: number;
  rating: number;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  createdAt: string;
  isPrivate: boolean;
  gratitudeItems: string[];
}

interface CopingStrategy {
  id: string;
  name: string;
  description: string;
  category: string;
  effectiveness: number;
  icon: string;
  color: string;
}

interface SupportGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  nextMeeting: string;
  type: 'in_person' | 'online';
  cancerType: string;
  facilitator: string;
}

// ==================== Mood Tracker Card ====================
const MoodTrackerCard: React.FC<{
  onSelectMood: (mood: number) => void;
  selectedMood: number | null;
}> = ({ onSelectMood, selectedMood }) => {
  const moods = [
    { value: 1, emoji: '😢', label: 'Very Low', color: '#F44336' },
    { value: 2, emoji: '😔', label: 'Low', color: '#FF9800' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#FFC107' },
    { value: 4, emoji: '🙂', label: 'Good', color: '#8BC34A' },
    { value: 5, emoji: '😊', label: 'Great', color: '#4CAF50' },
  ];

  const scaleAnims = useRef(moods.map(() => new Animated.Value(1))).current;

  const handleSelect = (mood: number, index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnims[index], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    onSelectMood(mood);
  };

  return (
    <View style={styles.moodTrackerCard}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.moodTrackerGradient}
      >
        <Text style={styles.moodTrackerTitle}>How are you feeling today?</Text>
        <Text style={styles.moodTrackerSubtitle}>
          Tracking your mood helps us provide better support
        </Text>
        <View style={styles.moodEmojisRow}>
          {moods.map((mood, index) => (
            <TouchableOpacity
              key={mood.value}
              onPress={() => handleSelect(mood.value, index)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.moodEmojiContainer,
                  selectedMood === mood.value && styles.moodEmojiSelected,
                  { transform: [{ scale: scaleAnims[index] }] },
                ]}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.value && styles.moodLabelSelected,
                ]}>
                  {mood.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// ==================== Wellness Score Widget ====================
const WellnessScoreWidget: React.FC<{
  anxietyLevel: number;
  sleepQuality: number;
  moodAverage: number;
  stressLevel: number;
}> = ({ anxietyLevel, sleepQuality, moodAverage, stressLevel }) => {
  const overallScore = Math.round((100 - anxietyLevel * 10 + sleepQuality * 10 + moodAverage * 20 + (100 - stressLevel * 10)) / 4);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: overallScore / 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [overallScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const metrics = [
    { label: 'Anxiety', value: anxietyLevel, max: 10, color: '#F44336', icon: 'brain' },
    { label: 'Sleep', value: sleepQuality, max: 10, color: '#2196F3', icon: 'sleep' },
    { label: 'Mood', value: moodAverage, max: 5, color: '#FF9800', icon: 'emoticon-happy' },
    { label: 'Stress', value: stressLevel, max: 10, color: '#9C27B0', icon: 'head-snowflake' },
  ];

  return (
    <View style={styles.wellnessCard}>
      <View style={styles.wellnessHeader}>
        <Text style={styles.wellnessTitle}>Wellness Score</Text>
        <View style={[styles.wellnessScoreBadge, { backgroundColor: getScoreColor(overallScore) + '20' }]}>
          <Text style={[styles.wellnessScoreValue, { color: getScoreColor(overallScore) }]}>{overallScore}</Text>
          <Text style={[styles.wellnessScoreLabel, { color: getScoreColor(overallScore) }]}>/100</Text>
        </View>
      </View>
      
      {metrics.map((metric, idx) => (
        <View key={idx} style={styles.wellnessMetricRow}>
          <View style={styles.wellnessMetricLabelRow}>
            <MaterialCommunityIcons name={metric.icon as any} size={16} color={metric.color} />
            <Text style={styles.wellnessMetricLabel}>{metric.label}</Text>
          </View>
          <View style={styles.wellnessMetricBarTrack}>
            <View
              style={[
                styles.wellnessMetricBarFill,
                {
                  width: `${(metric.value / metric.max) * 100}%`,
                  backgroundColor: metric.color,
                },
              ]}
            />
          </View>
          <Text style={styles.wellnessMetricValue}>{metric.value}/{metric.max}</Text>
        </View>
      ))}
    </View>
  );
};

// ==================== Meditation Card ====================
const MeditationCard: React.FC<{
  exercise: MeditationExercise;
  onPress: () => void;
  index: number;
}> = ({ exercise, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCategoryIcon = () => {
    switch (exercise.category) {
      case 'breathing': return 'weather-windy';
      case 'meditation': return 'meditation';
      case 'visualization': return 'eye';
      case 'progressive_relaxation': return 'human-handsup';
      case 'mindfulness': return 'brain';
    }
  };

  const getCategoryColor = () => {
    switch (exercise.category) {
      case 'breathing': return '#2196F3';
      case 'meditation': return '#9C27B0';
      case 'visualization': return '#FF9800';
      case 'progressive_relaxation': return '#4CAF50';
      case 'mindfulness': return '#00BCD4';
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.meditationCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.meditationIconContainer, { backgroundColor: getCategoryColor() + '15' }]}>
          <MaterialCommunityIcons name={getCategoryIcon() as any} size={28} color={getCategoryColor()} />
        </View>
        <View style={styles.meditationInfo}>
          <Text style={styles.meditationTitle}>{exercise.title}</Text>
          <Text style={styles.meditationDescription} numberOfLines={2}>
            {exercise.description}
          </Text>
          <View style={styles.meditationMeta}>
            <View style={styles.meditationMetaItem}>
              <Ionicons name="time-outline" size={12} color="#999" />
              <Text style={styles.meditationMetaText}>{exercise.duration} min</Text>
            </View>
            <View style={styles.meditationMetaItem}>
              <Ionicons name="star" size={12} color="#FFC107" />
              <Text style={styles.meditationMetaText}>{exercise.rating}</Text>
            </View>
            {exercise.cancerSpecific && (
              <View style={styles.cancerSpecificTag}>
                <MaterialCommunityIcons name="ribbon" size={10} color="#E91E63" />
                <Text style={styles.cancerSpecificText}>Cancer Support</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== Journal Entry Card ====================
const JournalEntryCard: React.FC<{
  entry: JournalEntry;
  onPress: () => void;
}> = ({ entry, onPress }) => {
  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '😐';
  };

  return (
    <TouchableOpacity style={styles.journalCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.journalCardHeader}>
        <Text style={styles.journalMoodEmoji}>{getMoodEmoji(entry.mood)}</Text>
        <View style={styles.journalTitleSection}>
          <Text style={styles.journalTitle}>{entry.title}</Text>
          <Text style={styles.journalDate}>{entry.createdAt}</Text>
        </View>
        {entry.isPrivate && (
          <Ionicons name="lock-closed" size={16} color="#999" />
        )}
      </View>
      <Text style={styles.journalContent} numberOfLines={3}>
        {entry.content}
      </Text>
      {entry.gratitudeItems.length > 0 && (
        <View style={styles.gratitudeSection}>
          <MaterialCommunityIcons name="heart" size={14} color="#E91E63" />
          <Text style={styles.gratitudeText}>
            {entry.gratitudeItems.length} gratitude items
          </Text>
        </View>
      )}
      <View style={styles.journalTags}>
        {entry.tags.map((tag, idx) => (
          <View key={idx} style={styles.journalTag}>
            <Text style={styles.journalTagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

// ==================== Support Group Card ====================
const SupportGroupCard: React.FC<{
  group: SupportGroup;
  onJoin: () => void;
}> = ({ group, onJoin }) => {
  return (
    <View style={styles.supportGroupCard}>
      <View style={styles.supportGroupHeader}>
        <View style={styles.supportGroupIcon}>
          <Ionicons name="people" size={24} color="#667eea" />
        </View>
        <View style={styles.supportGroupInfo}>
          <Text style={styles.supportGroupName}>{group.name}</Text>
          <Text style={styles.supportGroupFacilitator}>Led by {group.facilitator}</Text>
        </View>
        <View style={[styles.onlineBadge, { backgroundColor: group.type === 'online' ? '#4CAF5020' : '#2196F320' }]}>
          <Ionicons
            name={group.type === 'online' ? 'videocam' : 'location'}
            size={12}
            color={group.type === 'online' ? '#4CAF50' : '#2196F3'}
          />
          <Text style={{ fontSize: 10, color: group.type === 'online' ? '#4CAF50' : '#2196F3', fontWeight: '600' }}>
            {group.type === 'online' ? 'Online' : 'In Person'}
          </Text>
        </View>
      </View>
      <Text style={styles.supportGroupDescription}>{group.description}</Text>
      <View style={styles.supportGroupMeta}>
        <View style={styles.supportGroupMetaItem}>
          <Ionicons name="people-outline" size={14} color="#666" />
          <Text style={styles.supportGroupMetaText}>{group.memberCount} members</Text>
        </View>
        <View style={styles.supportGroupMetaItem}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.supportGroupMetaText}>Next: {group.nextMeeting}</Text>
        </View>
      </View>
      <View style={styles.supportGroupFooter}>
        <View style={styles.cancerTypeTag}>
          <MaterialCommunityIcons name="ribbon" size={12} color="#E91E63" />
          <Text style={styles.cancerTypeTagText}>{group.cancerType}</Text>
        </View>
        <TouchableOpacity style={styles.joinButton} onPress={onJoin} activeOpacity={0.7}>
          <Text style={styles.joinButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== Journal Modal ====================
const JournalModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Partial<JournalEntry>) => void;
}> = ({ visible, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [gratitudeItems, setGratitudeItems] = useState<string[]>(['', '', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    onSave({
      title: title || 'Untitled Entry',
      content,
      mood,
      tags,
      gratitudeItems: gratitudeItems.filter(Boolean),
      isPrivate: true,
    });
    setTitle('');
    setContent('');
    setMood(3);
    setGratitudeItems(['', '', '']);
    setTags([]);
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.journalModalContainer}>
        <View style={styles.journalModalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.journalModalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.journalModalTitle}>New Journal Entry</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.journalModalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.journalModalContent} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.journalTitleInput}
            placeholder="Entry title..."
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />

          {/* Mood Selector */}
          <View style={styles.journalMoodSelector}>
            <Text style={styles.journalMoodLabel}>Current Mood</Text>
            <View style={styles.journalMoodRow}>
              {['😢', '😔', '😐', '🙂', '😊'].map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.journalMoodOption,
                    mood === idx + 1 && styles.journalMoodOptionSelected,
                  ]}
                  onPress={() => setMood(idx + 1)}
                >
                  <Text style={styles.journalMoodEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.journalContentInput}
            placeholder="Write about your day, feelings, thoughts..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#999"
          />

          {/* Gratitude Section */}
          <View style={styles.gratitudeInputSection}>
            <Text style={styles.gratitudeInputTitle}>
              <MaterialCommunityIcons name="heart" size={16} color="#E91E63" /> Gratitude Items
            </Text>
            {gratitudeItems.map((item, idx) => (
              <TextInput
                key={idx}
                style={styles.gratitudeInput}
                placeholder={`I'm grateful for...`}
                value={item}
                onChangeText={(text) => {
                  const updated = [...gratitudeItems];
                  updated[idx] = text;
                  setGratitudeItems(updated);
                }}
                placeholderTextColor="#999"
              />
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagInputSection}>
            <Text style={styles.tagInputTitle}>Tags</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagTextInput}
                placeholder="Add a tag..."
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsRow}>
              {tags.map((tag, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.tagChip}
                  onPress={() => setTags(tags.filter((_, i) => i !== idx))}
                >
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <Ionicons name="close" size={12} color="#667eea" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ==================== Main MentalHealthScreen ====================
const MentalHealthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'mood' | 'meditation' | 'journal' | 'support'>('mood');
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const therapySessions: TherapySession[] = useMemo(() => [
    {
      id: '1', therapistName: 'Dr. Lisa Chen', type: 'individual',
      date: 'Mar 3, 2026', time: '10:00 AM', duration: 60,
      status: 'upcoming', notes: 'Follow-up on coping strategies',
    },
    {
      id: '2', therapistName: 'Support Group Facilitator', type: 'group',
      date: 'Mar 5, 2026', time: '2:00 PM', duration: 90,
      status: 'upcoming', notes: 'Weekly cancer support group',
    },
    {
      id: '3', therapistName: 'Dr. Lisa Chen', type: 'online',
      date: 'Feb 24, 2026', time: '10:00 AM', duration: 60,
      status: 'completed', notes: 'Discussed anxiety management',
    },
  ], []);

  const meditationExercises: MeditationExercise[] = useMemo(() => [
    {
      id: '1', title: 'Calming Breath for Anxiety',
      description: 'A gentle breathing exercise designed to reduce anxiety during cancer treatment',
      duration: 10, category: 'breathing', difficulty: 'beginner',
      cancerSpecific: true, completedCount: 15, rating: 4.8,
    },
    {
      id: '2', title: 'Body Scan Meditation',
      description: 'Progressive body relaxation to release tension and promote healing',
      duration: 20, category: 'progressive_relaxation', difficulty: 'beginner',
      cancerSpecific: true, completedCount: 8, rating: 4.6,
    },
    {
      id: '3', title: 'Healing Visualization',
      description: 'Guided imagery focusing on your body\'s healing process',
      duration: 15, category: 'visualization', difficulty: 'intermediate',
      cancerSpecific: true, completedCount: 12, rating: 4.9,
    },
    {
      id: '4', title: 'Mindful Gratitude Practice',
      description: 'Cultivate gratitude and positive emotions through mindful awareness',
      duration: 10, category: 'mindfulness', difficulty: 'beginner',
      cancerSpecific: false, completedCount: 20, rating: 4.7,
    },
    {
      id: '5', title: 'Sleep Meditation',
      description: 'Deep relaxation to improve sleep quality during treatment',
      duration: 30, category: 'meditation', difficulty: 'beginner',
      cancerSpecific: true, completedCount: 25, rating: 4.9,
    },
    {
      id: '6', title: 'Pain Management Meditation',
      description: 'Mindfulness techniques to help manage chronic pain and discomfort',
      duration: 15, category: 'meditation', difficulty: 'intermediate',
      cancerSpecific: true, completedCount: 10, rating: 4.5,
    },
  ], []);

  const journalEntries: JournalEntry[] = useMemo(() => [
    {
      id: '1', title: 'A Good Day', content: 'Today was surprisingly good. I managed to go for a walk in the park and felt more energetic than usual. The fresh air really helped clear my mind.',
      mood: 4, tags: ['grateful', 'exercise', 'nature'], createdAt: 'Feb 26, 2026',
      isPrivate: true, gratitudeItems: ['Sunshine', 'My supportive family', 'Energy to walk'],
    },
    {
      id: '2', title: 'Treatment Day Reflections', content: 'Had my chemotherapy session today. Feeling tired but staying positive. The nurses were incredibly kind and supportive.',
      mood: 3, tags: ['treatment', 'reflection', 'hope'], createdAt: 'Feb 24, 2026',
      isPrivate: true, gratitudeItems: ['Kind nurses', 'Progress in treatment'],
    },
    {
      id: '3', title: 'Finding Strength', content: 'Joined the online support group today and it really helped. Hearing others\' stories made me feel less alone in this journey.',
      mood: 4, tags: ['support', 'community', 'strength'], createdAt: 'Feb 22, 2026',
      isPrivate: false, gratitudeItems: ['Support group', 'Shared experiences', 'Hope'],
    },
  ], []);

  const supportGroups: SupportGroup[] = useMemo(() => [
    {
      id: '1', name: 'Cancer Warriors Support Circle', description: 'A safe space for cancer patients to share experiences, challenges, and victories.',
      memberCount: 45, nextMeeting: 'Mar 1, 2026', type: 'online',
      cancerType: 'All Types', facilitator: 'Dr. Sarah Mitchell',
    },
    {
      id: '2', name: 'Breast Cancer Survivors', description: 'Peer support group specifically for breast cancer patients and survivors.',
      memberCount: 32, nextMeeting: 'Mar 3, 2026', type: 'in_person',
      cancerType: 'Breast Cancer', facilitator: 'Maria Rodriguez',
    },
    {
      id: '3', name: 'Caregiver Support Network', description: 'Support and resources for family members and caregivers of cancer patients.',
      memberCount: 28, nextMeeting: 'Mar 2, 2026', type: 'online',
      cancerType: 'Caregivers', facilitator: 'James Wilson',
    },
    {
      id: '4', name: 'Young Adults with Cancer', description: 'Connecting young adults (18-35) navigating cancer diagnosis and treatment.',
      memberCount: 38, nextMeeting: 'Mar 4, 2026', type: 'online',
      cancerType: 'All Types (18-35)', facilitator: 'Dr. Emily Park',
    },
  ], []);

  const copingStrategies: CopingStrategy[] = useMemo(() => [
    { id: '1', name: 'Deep Breathing', description: '4-7-8 technique for anxiety relief', category: 'Relaxation', effectiveness: 85, icon: 'weather-windy', color: '#2196F3' },
    { id: '2', name: 'Progressive Muscle Relaxation', description: 'Systematic tension release', category: 'Physical', effectiveness: 78, icon: 'human-handsup', color: '#4CAF50' },
    { id: '3', name: 'Guided Imagery', description: 'Visualize healing and peace', category: 'Mental', effectiveness: 82, icon: 'image-filter-hdr', color: '#9C27B0' },
    { id: '4', name: 'Journaling', description: 'Express emotions through writing', category: 'Expression', effectiveness: 75, icon: 'book-open-variant', color: '#FF9800' },
    { id: '5', name: 'Social Connection', description: 'Reach out to loved ones', category: 'Social', effectiveness: 88, icon: 'account-group', color: '#E91E63' },
    { id: '6', name: 'Physical Activity', description: 'Gentle exercise like walking', category: 'Physical', effectiveness: 80, icon: 'walk', color: '#00BCD4' },
  ], []);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const renderMoodTab = () => (
    <>
      <MoodTrackerCard onSelectMood={setSelectedMood} selectedMood={selectedMood} />

      <WellnessScoreWidget
        anxietyLevel={4}
        sleepQuality={7}
        moodAverage={3.5}
        stressLevel={5}
      />

      {/* Weekly Mood History */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>This Week's Mood</Text>
        <View style={styles.weeklyMoodContainer}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
            const moods = [3, 4, 2, 4, 3, 5, 4];
            const emojis = ['😐', '🙂', '😔', '🙂', '😐', '😊', '🙂'];
            return (
              <View key={day} style={styles.weeklyMoodDay}>
                <Text style={styles.weeklyMoodEmoji}>{emojis[idx]}</Text>
                <View style={[styles.weeklyMoodBar, { height: moods[idx] * 16, backgroundColor: `hsl(${moods[idx] * 30}, 70%, 50%)` }]} />
                <Text style={styles.weeklyMoodDayLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Coping Strategies */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Coping Strategies</Text>
        {copingStrategies.map((strategy) => (
          <TouchableOpacity key={strategy.id} style={styles.strategyCard} activeOpacity={0.7}>
            <View style={[styles.strategyIcon, { backgroundColor: strategy.color + '15' }]}>
              <MaterialCommunityIcons name={strategy.icon as any} size={22} color={strategy.color} />
            </View>
            <View style={styles.strategyInfo}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
              <View style={styles.effectivenessBar}>
                <View style={[styles.effectivenessFill, { width: `${strategy.effectiveness}%`, backgroundColor: strategy.color }]} />
              </View>
            </View>
            <Text style={[styles.effectivenessText, { color: strategy.color }]}>
              {strategy.effectiveness}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Therapy Sessions */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Therapy Sessions</Text>
        {therapySessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionCardHeader}>
              <View style={[styles.sessionTypeIcon, {
                backgroundColor: session.status === 'upcoming' ? '#4CAF5020' : '#9E9E9E20'
              }]}>
                <Ionicons
                  name={session.type === 'online' ? 'videocam' : session.type === 'group' ? 'people' : 'person'}
                  size={18}
                  color={session.status === 'upcoming' ? '#4CAF50' : '#9E9E9E'}
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTherapist}>{session.therapistName}</Text>
                <Text style={styles.sessionDateTime}>{session.date} at {session.time}</Text>
              </View>
              <View style={[styles.sessionStatusBadge, {
                backgroundColor: session.status === 'upcoming' ? '#4CAF5020' : session.status === 'completed' ? '#2196F320' : '#F4433620'
              }]}>
                <Text style={[styles.sessionStatusText, {
                  color: session.status === 'upcoming' ? '#4CAF50' : session.status === 'completed' ? '#2196F3' : '#F44336'
                }]}>
                  {session.status}
                </Text>
              </View>
            </View>
            {session.notes && (
              <Text style={styles.sessionNotes}>{session.notes}</Text>
            )}
          </View>
        ))}
      </View>
    </>
  );

  const renderMeditationTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Guided Exercises</Text>
      <Text style={styles.sectionSubtitle}>Designed for cancer patients and caregivers</Text>

      {/* Quick Start */}
      <TouchableOpacity style={styles.quickStartCard} activeOpacity={0.7}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickStartGradient}
        >
          <View style={styles.quickStartContent}>
            <View>
              <Text style={styles.quickStartTitle}>Quick Relief Session</Text>
              <Text style={styles.quickStartSubtitle}>5 min guided breathing</Text>
            </View>
            <View style={styles.quickStartPlayButton}>
              <Ionicons name="play" size={28} color="#667eea" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {meditationExercises.map((exercise, idx) => (
        <MeditationCard
          key={exercise.id}
          exercise={exercise}
          onPress={() => Alert.alert('Start Exercise', `Begin "${exercise.title}"?`)}
          index={idx}
        />
      ))}
    </View>
  );

  const renderJournalTab = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Journal Entries</Text>
        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => setShowJournalModal(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newEntryButtonText}>New Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Prompt Card */}
      <View style={styles.promptCard}>
        <MaterialCommunityIcons name="lightbulb-outline" size={24} color="#FF9800" />
        <View style={styles.promptContent}>
          <Text style={styles.promptTitle}>Today's Prompt</Text>
          <Text style={styles.promptText}>
            What small moment brought you joy today? How can you create more of those moments?
          </Text>
        </View>
      </View>

      {journalEntries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          onPress={() => {}}
        />
      ))}
    </View>
  );

  const renderSupportTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Support Groups</Text>
      <Text style={styles.sectionSubtitle}>Connect with others on a similar journey</Text>

      {/* Crisis Resources */}
      <TouchableOpacity style={styles.crisisCard} activeOpacity={0.7}>
        <LinearGradient
          colors={['#F44336', '#E91E63']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.crisisGradient}
        >
          <Ionicons name="call" size={24} color="#fff" />
          <View style={styles.crisisContent}>
            <Text style={styles.crisisTitle}>Need Immediate Support?</Text>
            <Text style={styles.crisisText}>
              Cancer Support Helpline: 1-800-227-2345
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </TouchableOpacity>

      {supportGroups.map((group) => (
        <SupportGroupCard
          key={group.id}
          group={group}
          onJoin={() => Alert.alert('Join Group', `Join "${group.name}"?`)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mental Health</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#667eea" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
        {(['mood', 'meditation', 'journal', 'support'] as const).map((tab) => (
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#667eea']} />
        }
      >
        {selectedTab === 'mood' && renderMoodTab()}
        {selectedTab === 'meditation' && renderMeditationTab()}
        {selectedTab === 'journal' && renderJournalTab()}
        {selectedTab === 'support' && renderSupportTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <JournalModal
        visible={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        onSave={(entry) => Alert.alert('Saved', 'Journal entry saved successfully!')}
      />
    </SafeAreaView>
  );
};

// ==================== Styles ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: '#999', marginBottom: 16 },
  moodTrackerCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  moodTrackerGradient: { padding: 24 },
  moodTrackerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  moodTrackerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },
  moodEmojisRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodEmojiContainer: {
    alignItems: 'center', padding: 12, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  moodEmojiSelected: { backgroundColor: 'rgba(255,255,255,0.35)' },
  moodEmoji: { fontSize: 32 },
  moodLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  moodLabelSelected: { fontWeight: '700', color: '#fff' },
  wellnessCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  wellnessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  wellnessTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  wellnessScoreBadge: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  wellnessScoreValue: { fontSize: 24, fontWeight: '800' },
  wellnessScoreLabel: { fontSize: 12, fontWeight: '500' },
  wellnessMetricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  wellnessMetricLabelRow: { flexDirection: 'row', alignItems: 'center', width: 80, gap: 4 },
  wellnessMetricLabel: { fontSize: 12, color: '#666' },
  wellnessMetricBarTrack: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  wellnessMetricBarFill: { height: '100%', borderRadius: 3 },
  wellnessMetricValue: { fontSize: 12, color: '#333', fontWeight: '600', width: 30, textAlign: 'right' },
  weeklyMoodContainer: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    backgroundColor: '#fff', borderRadius: 16, padding: 20, height: 160,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  weeklyMoodDay: { alignItems: 'center' },
  weeklyMoodEmoji: { fontSize: 16, marginBottom: 4 },
  weeklyMoodBar: { width: 20, borderRadius: 10, minHeight: 4 },
  weeklyMoodDayLabel: { fontSize: 10, color: '#999', marginTop: 4 },
  strategyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  strategyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  strategyInfo: { flex: 1, marginLeft: 12 },
  strategyName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  strategyDescription: { fontSize: 12, color: '#999', marginTop: 2 },
  effectivenessBar: { height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  effectivenessFill: { height: '100%', borderRadius: 2 },
  effectivenessText: { fontSize: 13, fontWeight: '700', marginLeft: 8 },
  sessionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  sessionCardHeader: { flexDirection: 'row', alignItems: 'center' },
  sessionTypeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { flex: 1, marginLeft: 12 },
  sessionTherapist: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  sessionDateTime: { fontSize: 12, color: '#999', marginTop: 2 },
  sessionStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sessionStatusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  sessionNotes: { fontSize: 12, color: '#666', marginTop: 8, fontStyle: 'italic' },
  meditationCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  meditationIconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  meditationInfo: { flex: 1, marginLeft: 12 },
  meditationTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  meditationDescription: { fontSize: 12, color: '#999', marginTop: 2 },
  meditationMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  meditationMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  meditationMetaText: { fontSize: 11, color: '#999' },
  cancerSpecificTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCE4EC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  cancerSpecificText: { fontSize: 9, color: '#E91E63', fontWeight: '600' },
  playButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#667eea',
    alignItems: 'center', justifyContent: 'center',
  },
  quickStartCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  quickStartGradient: { padding: 20 },
  quickStartContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickStartTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  quickStartSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  quickStartPlayButton: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  journalCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  journalCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  journalMoodEmoji: { fontSize: 28 },
  journalTitleSection: { flex: 1, marginLeft: 12 },
  journalTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  journalDate: { fontSize: 12, color: '#999', marginTop: 2 },
  journalContent: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 8 },
  gratitudeSection: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  gratitudeText: { fontSize: 12, color: '#E91E63' },
  journalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  journalTag: { backgroundColor: '#F0F4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  journalTagText: { fontSize: 11, color: '#667eea', fontWeight: '500' },
  newEntryButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  newEntryButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  promptCard: {
    flexDirection: 'row', backgroundColor: '#FFF8E1', borderRadius: 12,
    padding: 16, marginBottom: 16, gap: 12,
  },
  promptContent: { flex: 1 },
  promptTitle: { fontSize: 14, fontWeight: '700', color: '#FF9800', marginBottom: 4 },
  promptText: { fontSize: 13, color: '#666', lineHeight: 20 },
  supportGroupCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  supportGroupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  supportGroupIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
  supportGroupInfo: { flex: 1, marginLeft: 12 },
  supportGroupName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  supportGroupFacilitator: { fontSize: 12, color: '#999', marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  supportGroupDescription: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  supportGroupMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  supportGroupMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  supportGroupMetaText: { fontSize: 12, color: '#666' },
  supportGroupFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cancerTypeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCE4EC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  cancerTypeTagText: { fontSize: 11, color: '#E91E63', fontWeight: '600' },
  joinButton: { backgroundColor: '#667eea', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  joinButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  crisisCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  crisisGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  crisisContent: { flex: 1 },
  crisisTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  crisisText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  journalModalContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  journalModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8',
  },
  journalModalCancel: { fontSize: 15, color: '#999' },
  journalModalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  journalModalSave: { fontSize: 15, fontWeight: '700', color: '#667eea' },
  journalModalContent: { flex: 1, padding: 20 },
  journalTitleInput: {
    fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#E8E8E8', paddingBottom: 12,
  },
  journalMoodSelector: { marginBottom: 16 },
  journalMoodLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  journalMoodRow: { flexDirection: 'row', gap: 12 },
  journalMoodOption: { padding: 8, borderRadius: 12, backgroundColor: '#F0F0F0' },
  journalMoodOptionSelected: { backgroundColor: '#667eea20' },
  journalMoodEmoji: { fontSize: 28 },
  journalContentInput: {
    fontSize: 15, color: '#333', lineHeight: 24, minHeight: 150,
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
  },
  gratitudeInputSection: { marginBottom: 16 },
  gratitudeInputTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  gratitudeInput: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8,
    fontSize: 14, color: '#333',
  },
  tagInputSection: { marginBottom: 20 },
  tagInputTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  tagInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tagTextInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 14, color: '#333' },
  tagAddButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  tagChipText: { fontSize: 12, color: '#667eea', fontWeight: '500' },
});

export default MentalHealthScreen;
