import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions,
  FlatList, TextInput, Modal, RefreshControl, ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== Types ====================
interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'injection' | 'topical' | 'iv' | 'inhaled';
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  purpose: string;
  sideEffects: string[];
  instructions: string;
  refillsRemaining: number;
  nextRefillDate: string;
  taken: boolean;
  times: { time: string; taken: boolean }[];
  category: 'chemotherapy' | 'pain' | 'anti_nausea' | 'hormone' | 'immunotherapy' | 'supplement' | 'other';
  interactions: string[];
  adherenceRate: number;
}

interface MedicationReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  time: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  dosage: string;
}

interface PharmacyInfo {
  name: string;
  phone: string;
  address: string;
  hours: string;
  deliveryAvailable: boolean;
}

// ==================== Animated Components ====================
const AnimatedPill: React.FC<{ taken: boolean; onPress: () => void }> = ({ taken, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(taken ? 1 : 0.8)).current;
  const colorAnim = useRef(new Animated.Value(taken ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: taken ? 1.1 : 0.9, useNativeDriver: true, tension: 100, friction: 5 }),
      Animated.timing(colorAnim, { toValue: taken ? 1 : 0, duration: 300, useNativeDriver: false }),
    ]).start(() => {
      if (taken) {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      }
    });
  }, [taken]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5F5F5', '#4CAF50'],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.pillIndicator, { backgroundColor, transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name={taken ? 'checkmark' : 'medical'} size={16} color={taken ? '#fff' : '#999'} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ==================== Adherence Ring ====================
const AdherenceRing: React.FC<{ percentage: number }> = ({ percentage }) => {
  const getColor = (pct: number) => {
    if (pct >= 90) return '#4CAF50';
    if (pct >= 70) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.adherenceContainer}>
      <View style={[styles.adherenceRing, { borderColor: getColor(percentage) + '30' }]}>
        <View style={[styles.adherenceProgress, { borderColor: getColor(percentage), borderTopColor: 'transparent' }]} />
        <Text style={[styles.adherenceText, { color: getColor(percentage) }]}>{percentage}%</Text>
      </View>
      <Text style={styles.adherenceLabel}>Adherence</Text>
    </View>
  );
};

// ==================== Medication Detail Card ====================
const MedicationDetailCard: React.FC<{
  medication: Medication;
  onToggleDose: (medId: string, timeIndex: number)=> void;
  expanded: boolean;
  onToggleExpand: () => void;
}> = ({ medication, onToggleDose, expanded, onToggleExpand }) => {
  const expandAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  const getCategoryColor = () => {
    switch (medication.category) {
      case 'chemotherapy': return '#F44336';
      case 'pain': return '#FF9800';
      case 'anti_nausea': return '#9C27B0';
      case 'hormone': return '#E91E63';
      case 'immunotherapy': return '#2196F3';
      case 'supplement': return '#4CAF50';
      default: return '#607D8B';
    }
  };

  const getCategoryIcon = () => {
    switch (medication.category) {
      case 'chemotherapy': return 'iv-bag';
      case 'pain': return 'pill';
      case 'anti_nausea': return 'stomach';
      case 'hormone': return 'molecule';
      case 'immunotherapy': return 'shield-plus';
      case 'supplement': return 'leaf';
      default: return 'medical-bag';
    }
  };

  const getRouteIcon = () => {
    switch (medication.route) {
      case 'oral': return 'pill';
      case 'injection': return 'needle';
      case 'topical': return 'hand-wash';
      case 'iv': return 'iv-bag';
      case 'inhaled': return 'weather-windy';
    }
  };

  const allTaken = medication.times.every(t => t.taken);
  const takenCount = medication.times.filter(t => t.taken).length;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.medCard} onPress={onToggleExpand} activeOpacity={0.85}>
        <View style={styles.medCardHeader}>
          <View style={[styles.medCategoryIcon, { backgroundColor: getCategoryColor() + '15' }]}>
            <MaterialCommunityIcons name={getCategoryIcon() as any} size={24} color={getCategoryColor()} />
          </View>
          <View style={styles.medCardTitleSection}>
            <View style={styles.medCardTitleRow}>
              <Text style={styles.medCardTitle}>{medication.name}</Text>
              {allTaken && (
                <View style={styles.allTakenBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              )}
            </View>
            <Text style={styles.medCardGeneric}>{medication.genericName}</Text>
            <Text style={styles.medCardDosage}>{medication.dosage} • {medication.frequency}</Text>
          </View>
          <AdherenceRing percentage={medication.adherenceRate} />
        </View>

        {/* Dose Schedule */}
        <View style={styles.doseScheduleRow}>
          {medication.times.map((timeSlot, idx) => (
            <View key={idx} style={styles.doseSlot}>
              <Text style={styles.doseTime}>{timeSlot.time}</Text>
              <AnimatedPill
                taken={timeSlot.taken}
                onPress={() => onToggleDose(medication.id, idx)}
              />
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.medProgressBar}>
          <View style={[styles.medProgressFill, {
            width: `${(takenCount / medication.times.length) * 100}%`,
            backgroundColor: getCategoryColor(),
          }]} />
        </View>
        <Text style={styles.medProgressText}>
          {takenCount}/{medication.times.length} doses taken today
        </Text>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#999"
          style={{ alignSelf: 'center', marginTop: 4 }}
        />

        {/* Expanded Details */}
        {expanded && (
          <Animated.View style={styles.medExpandedSection}>
            <View style={styles.medDetailRow}>
              <MaterialCommunityIcons name={getRouteIcon() as any} size={16} color="#666" />
              <Text style={styles.medDetailLabel}>Route:</Text>
              <Text style={styles.medDetailValue}>{medication.route}</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Ionicons name="person" size={16} color="#666" />
              <Text style={styles.medDetailLabel}>Prescribed by:</Text>
              <Text style={styles.medDetailValue}>{medication.prescribedBy}</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Ionicons name="medical" size={16} color="#666" />
              <Text style={styles.medDetailLabel}>Purpose:</Text>
              <Text style={styles.medDetailValue}>{medication.purpose}</Text>
            </View>
            <View style={styles.medDetailRow}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.medDetailLabel}>Start Date:</Text>
              <Text style={styles.medDetailValue}>{medication.startDate}</Text>
            </View>
            {medication.endDate && (
              <View style={styles.medDetailRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.medDetailLabel}>End Date:</Text>
                <Text style={styles.medDetailValue}>{medication.endDate}</Text>
              </View>
            )}
            <View style={styles.medDetailRow}>
              <MaterialCommunityIcons name="pill" size={16} color="#666" />
              <Text style={styles.medDetailLabel}>Refills:</Text>
              <Text style={styles.medDetailValue}>{medication.refillsRemaining} remaining</Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <MaterialCommunityIcons name="information" size={16} color="#2196F3" />
              <Text style={styles.instructionsText}>{medication.instructions}</Text>
            </View>

            {/* Side Effects */}
            {medication.sideEffects.length > 0 && (
              <View style={styles.sideEffectsSection}>
                <Text style={styles.sideEffectsTitle}>Possible Side Effects</Text>
                <View style={styles.sideEffectTags}>
                  {medication.sideEffects.map((effect, idx) => (
                    <View key={idx} style={styles.sideEffectTag}>
                      <Text style={styles.sideEffectText}>{effect}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Interactions */}
            {medication.interactions.length > 0 && (
              <View style={styles.interactionsSection}>
                <Text style={styles.interactionsTitle}>⚠️ Drug Interactions</Text>
                {medication.interactions.map((interaction, idx) => (
                  <View key={idx} style={styles.interactionItem}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color="#FF9800" />
                    <Text style={styles.interactionText}>{interaction}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.medActionRow}>
              <TouchableOpacity style={styles.medActionButton}>
                <Ionicons name="refresh" size={16} color="#667eea" />
                <Text style={styles.medActionText}>Refill</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.medActionButton}>
                <Ionicons name="alarm" size={16} color="#667eea" />
                <Text style={styles.medActionText}>Reminder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.medActionButton}>
                <Ionicons name="document-text" size={16} color="#667eea" />
                <Text style={styles.medActionText}>Info</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.medActionButton, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Text style={[styles.medActionText, { color: '#FF9800' }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== Reminder Card ====================
const ReminderCard: React.FC<{
  reminder: MedicationReminder;
  onAction: (action: 'take' | 'skip') => void;
}> = ({ reminder, onAction }) => {
  const getStatusColor = () => {
    switch (reminder.status) {
      case 'pending': return '#FF9800';
      case 'taken': return '#4CAF50';
      case 'missed': return '#F44336';
      case 'skipped': return '#9E9E9E';
    }
  };

  return (
    <View style={[styles.reminderCard, { borderLeftColor: getStatusColor(), borderLeftWidth: 3 }]}>
      <View style={styles.reminderCardContent}>
        <View style={styles.reminderTimeSection}>
          <Text style={styles.reminderTime}>{reminder.time}</Text>
          <View style={[styles.reminderStatusDot, { backgroundColor: getStatusColor() }]} />
        </View>
        <View style={styles.reminderInfo}>
          <Text style={styles.reminderMedName}>{reminder.medicationName}</Text>
          <Text style={styles.reminderDosage}>{reminder.dosage}</Text>
        </View>
        {reminder.status === 'pending' && (
          <View style={styles.reminderActions}>
            <TouchableOpacity
              style={[styles.reminderActionBtn, { backgroundColor: '#4CAF5015' }]}
              onPress={() => onAction('take')}
            >
              <Ionicons name="checkmark" size={18} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reminderActionBtn, { backgroundColor: '#9E9E9E15' }]}
              onPress={() => onAction('skip')}
            >
              <Ionicons name="close" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        )}
        {reminder.status !== 'pending' && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
              {reminder.status}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ==================== Main MedicationManagementScreen ====================
const MedicationManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'current' | 'schedule' | 'history' | 'pharmacy'>('current');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const headerAnim = useRef(new Animated.Value(0)).current;

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1', name: 'Capecitabine', genericName: 'Xeloda',
      dosage: '500mg', frequency: 'Twice daily',
      route: 'oral', startDate: 'Jan 15, 2026', endDate: 'Apr 15, 2026',
      prescribedBy: 'Dr. Sarah Johnson', purpose: 'Chemotherapy - treats breast cancer',
      sideEffects: ['Nausea', 'Fatigue', 'Hand-foot syndrome', 'Diarrhea', 'Loss of appetite'],
      instructions: 'Take with food within 30 minutes after a meal. Drink plenty of water.',
      refillsRemaining: 2, nextRefillDate: 'Mar 10, 2026',
      taken: false,
      times: [
        { time: '8:00 AM', taken: true },
        { time: '8:00 PM', taken: false },
      ],
      category: 'chemotherapy',
      interactions: ['Warfarin - increased bleeding risk', 'Phenytoin - increased toxicity'],
      adherenceRate: 95,
    },
    {
      id: '2', name: 'Ondansetron', genericName: 'Zofran',
      dosage: '8mg', frequency: 'As needed',
      route: 'oral', startDate: 'Jan 15, 2026',
      prescribedBy: 'Dr. Sarah Johnson', purpose: 'Anti-nausea medication for chemotherapy side effects',
      sideEffects: ['Headache', 'Constipation', 'Fatigue'],
      instructions: 'Take 30 minutes before chemotherapy or as needed for nausea. Max 24mg/day.',
      refillsRemaining: 5, nextRefillDate: 'Mar 15, 2026',
      taken: false,
      times: [
        { time: '7:30 AM', taken: true },
        { time: '12:00 PM', taken: false },
        { time: '6:00 PM', taken: false },
      ],
      category: 'anti_nausea',
      interactions: ['Apomorphine - may cause severe hypotension'],
      adherenceRate: 88,
    },
    {
      id: '3', name: 'Tamoxifen', genericName: 'Nolvadex',
      dosage: '20mg', frequency: 'Once daily',
      route: 'oral', startDate: 'Feb 1, 2026', endDate: 'Feb 1, 2031',
      prescribedBy: 'Dr. Michael Chen', purpose: 'Hormone therapy - reduces cancer recurrence risk',
      sideEffects: ['Hot flashes', 'Joint pain', 'Mood changes', 'Fatigue'],
      instructions: 'Take at the same time each day with or without food.',
      refillsRemaining: 8, nextRefillDate: 'Mar 1, 2026',
      taken: false,
      times: [{ time: '9:00 AM', taken: true }],
      category: 'hormone',
      interactions: ['SSRIs - may reduce tamoxifen effectiveness', 'Blood thinners - increased risk'],
      adherenceRate: 98,
    },
    {
      id: '4', name: 'Vitamin D3', genericName: 'Cholecalciferol',
      dosage: '2000 IU', frequency: 'Once daily',
      route: 'oral', startDate: 'Dec 1, 2025',
      prescribedBy: 'Dr. Sarah Johnson', purpose: 'Supplement - bone health and immune support',
      sideEffects: ['Rare at recommended doses'],
      instructions: 'Take with a meal containing fat for better absorption.',
      refillsRemaining: 10, nextRefillDate: 'Apr 1, 2026',
      taken: false,
      times: [{ time: '8:00 AM', taken: true }],
      category: 'supplement',
      interactions: [],
      adherenceRate: 92,
    },
    {
      id: '5', name: 'Morphine Sulfate ER', genericName: 'MS Contin',
      dosage: '15mg', frequency: 'Twice daily',
      route: 'oral', startDate: 'Feb 10, 2026',
      prescribedBy: 'Dr. Emily Wright', purpose: 'Pain management for cancer-related pain',
      sideEffects: ['Drowsiness', 'Constipation', 'Nausea', 'Dizziness'],
      instructions: 'Do not crush or chew. Take at regular intervals. Do not stop suddenly.',
      refillsRemaining: 1, nextRefillDate: 'Mar 5, 2026',
      taken: false,
      times: [
        { time: '8:00 AM', taken: true },
        { time: '8:00 PM', taken: false },
      ],
      category: 'pain',
      interactions: ['Benzodiazepines - respiratory depression risk', 'MAOIs - dangerous interaction'],
      adherenceRate: 96,
    },
  ]);

  const reminders: MedicationReminder[] = useMemo(() => [
    { id: '1', medicationId: '1', medicationName: 'Capecitabine', time: '8:00 AM', status: 'taken', dosage: '500mg' },
    { id: '2', medicationId: '2', medicationName: 'Ondansetron', time: '7:30 AM', status: 'taken', dosage: '8mg' },
    { id: '3', medicationId: '3', medicationName: 'Tamoxifen', time: '9:00 AM', status: 'taken', dosage: '20mg' },
    { id: '4', medicationId: '4', medicationName: 'Vitamin D3', time: '8:00 AM', status: 'taken', dosage: '2000 IU' },
    { id: '5', medicationId: '5', medicationName: 'Morphine Sulfate ER', time: '8:00 AM', status:'taken', dosage: '15mg' },
    { id: '6', medicationId: '2', medicationName: 'Ondansetron', time: '12:00 PM', status: 'pending', dosage: '8mg' },
    { id: '7', medicationId: '1', medicationName: 'Capecitabine', time: '8:00 PM', status: 'pending', dosage: '500mg' },
    { id: '8', medicationId: '2', medicationName: 'Ondansetron', time: '6:00 PM', status: 'pending', dosage: '8mg' },
    { id: '9', medicationId: '5', medicationName: 'Morphine Sulfate ER', time: '8:00 PM', status: 'pending', dosage: '15mg' },
  ], []);

  const pharmacy: PharmacyInfo = useMemo(() => ({
    name: 'CareFirst Pharmacy',
    phone: '(555) 123-4567',
    address: '123 Healthcare Blvd, Suite 100',
    hours: 'Mon-Fri: 8AM-9PM, Sat: 9AM-6PM, Sun: 10AM-4PM',
    deliveryAvailable: true,
  }), []);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleToggleDose = useCallback((medId: string, timeIndex: number) => {
    setMedications((prev) =>
      prev.map((med) => {
        if (med.id === medId) {
          const updatedTimes = [...med.times];
          updatedTimes[timeIndex] = { ...updatedTimes[timeIndex], taken: !updatedTimes[timeIndex].taken };
          return { ...med, times: updatedTimes };
        }
        return med;
      })
    );
  }, []);

  const totalDoses = medications.reduce((sum, m) => sum + m.times.length, 0);
  const takenDoses = medications.reduce((sum, m) => sum + m.times.filter(t => t.taken).length, 0);
  const overallAdherence = Math.round((takenDoses / totalDoses) * 100);

  const filteredMeds = useMemo(() =>
    medications.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [medications, searchQuery]
  );

  const renderCurrentTab = () => (
    <>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryContent}>
            <View style={styles.summaryMainStat}>
              <Text style={styles.summaryValue}>{overallAdherence}%</Text>
              <Text style={styles.summaryLabel}>Overall Adherence</Text>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{medications.length}</Text>
                <Text style={styles.summaryStatLabel}>Active Meds</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{takenDoses}/{totalDoses}</Text>
                <Text style={styles.summaryStatLabel}>Doses Today</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {medications.reduce((sum, m) => sum + m.refillsRemaining, 0)}
                </Text>
                <Text style={styles.summaryStatLabel}>Total Refills</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Medication Cards */}
      <View style={styles.sectionContainer}>
        {filteredMeds.map((med) => (
          <MedicationDetailCard
            key={med.id}
            medication={med}
            onToggleDose={handleToggleDose}
            expanded={expandedMedId === med.id}
            onToggleExpand={() => setExpandedMedId(expandedMedId === med.id ? null : med.id)}
          />
        ))}
      </View>
    </>
  );

  const renderScheduleTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Today's Schedule</Text>
      
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {reminders.map((reminder, idx) => (
          <View key={reminder.id} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: reminder.status === 'taken' ? '#4CAF50' : reminder.status === 'pending' ? '#FF9800' : '#F44336' }
              ]} />
              {idx < reminders.length - 1 && <View style={styles.timelineConnector} />}
            </View>
            <ReminderCard
              reminder={reminder}
              onAction={(action) => Alert.alert(action === 'take' ? 'Medication Taken' : 'Dose Skipped')}
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Medication History</Text>

      {/* Weekly Adherence Chart */}
      <View style={styles.weeklyChart}>
        <Text style={styles.chartTitle}>Weekly Adherence</Text>
        <View style={styles.chartBars}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
            const values = [95, 100, 87, 92, 100, 80, 95];
            return (
              <View key={day} style={styles.chartBarColumn}>
                <Text style={styles.chartBarValue}>{values[idx]}%</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[
                    styles.chartBarFill,
                    {
                      height: `${values[idx]}%`,
                      backgroundColor: values[idx] >= 90 ? '#4CAF50' : values[idx] >= 70 ? '#FF9800' : '#F44336',
                    },
                  ]} />
                </View>
                <Text style={styles.chartBarLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* History Entries */}
      {[
        { date: 'Feb 26, 2026', taken: 8, total: 10, notes: 'Missed evening ondansetron and morphine' },
        { date: 'Feb 25, 2026', taken: 10, total: 10, notes: 'All medications taken on time' },
        { date: 'Feb 24, 2026', taken: 9, total: 10, notes: 'Delayed morning dose by 1 hour' },
        { date: 'Feb 23, 2026', taken: 10, total: 10, notes: 'Perfect adherence' },
        { date: 'Feb 22, 2026', taken: 8, total: 10, notes: 'Skipped anti-nausea - feeling better' },
      ].map((entry, idx) => (
        <View key={idx} style={styles.historyEntry}>
          <View style={styles.historyEntryHeader}>
            <Text style={styles.historyDate}>{entry.date}</Text>
            <View style={[styles.historyBadge, {
              backgroundColor: entry.taken === entry.total ? '#4CAF5020' : '#FF980020',
            }]}>
              <Text style={[styles.historyBadgeText, {
                color: entry.taken === entry.total ? '#4CAF50' : '#FF9800',
              }]}>
                {entry.taken}/{entry.total}
              </Text>
            </View>
          </View>
          <View style={styles.historyProgressBar}>
            <View style={[styles.historyProgressFill, {
              width: `${(entry.taken / entry.total) * 100}%`,
              backgroundColor: entry.taken === entry.total ? '#4CAF50' : '#FF9800',
            }]} />
          </View>
          <Text style={styles.historyNotes}>{entry.notes}</Text>
        </View>
      ))}
    </View>
  );

  const renderPharmacyTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Pharmacy</Text>
      
      {/* Pharmacy Info */}
      <View style={styles.pharmacyCard}>
        <View style={styles.pharmacyHeader}>
          <MaterialCommunityIcons name="pharmacy" size={32} color="#667eea" />
          <View style={styles.pharmacyInfo}>
            <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
            {pharmacy.deliveryAvailable && (
              <View style={styles.deliveryBadge}>
                <MaterialCommunityIcons name="truck-delivery" size={12} color="#4CAF50" />
                <Text style={styles.deliveryText}>Delivery Available</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.pharmacyDetails}>
          <View style={styles.pharmacyDetailRow}>
            <Ionicons name="call" size={16} color="#666" />
            <Text style={styles.pharmacyDetailText}>{pharmacy.phone}</Text>
          </View>
          <View style={styles.pharmacyDetailRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.pharmacyDetailText}>{pharmacy.address}</Text>
          </View>
          <View style={styles.pharmacyDetailRow}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.pharmacyDetailText}>{pharmacy.hours}</Text>
          </View>
        </View>
        <View style={styles.pharmacyActions}>
          <TouchableOpacity style={styles.pharmacyActionBtn}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.pharmacyActionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pharmacyActionBtn, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.pharmacyActionText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pharmacyActionBtn, { backgroundColor: '#FF9800' }]}>
            <MaterialCommunityIcons name="pill" size={18} color="#fff" />
            <Text style={styles.pharmacyActionText}>Refill</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Refills */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Upcoming Refills</Text>
      {medications.filter(m => m.refillsRemaining <= 3).map((med) => (
        <View key={med.id} style={[styles.refillCard, med.refillsRemaining <= 1 && styles.refillCardUrgent]}>
          <View style={styles.refillCardHeader}>
            <MaterialCommunityIcons name="pill" size={20} color={med.refillsRemaining <= 1 ? '#F44336' : '#FF9800'} />
            <View style={styles.refillInfo}>
              <Text style={styles.refillMedName}>{med.name}</Text>
              <Text style={styles.refillDate}>Next refill: {med.nextRefillDate}</Text>
            </View>
            <View style={[styles.refillCountBadge, {
              backgroundColor: med.refillsRemaining <= 1 ? '#F4433620' : '#FF980020',
            }]}>
              <Text style={[styles.refillCountText, {
                color: med.refillsRemaining <= 1 ? '#F44336' : '#FF9800',
              }]}>
                {med.refillsRemaining} left
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refillButton}>
            <Text style={styles.refillButtonText}>Request Refill</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Medications</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={28} color="#667eea" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabScrollContent}>
        {(['current', 'schedule', 'history', 'pharmacy'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, selectedTab === tab && styles.tabChipActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabChipText, selectedTab === tab && styles.tabChipTextActive]}>
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
        {selectedTab === 'current' && renderCurrentTab()}
        {selectedTab === 'schedule' && renderScheduleTab()}
        {selectedTab === 'history' && renderHistoryTab()}
        {selectedTab === 'pharmacy' && renderPharmacyTab()}
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
  tabChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#E8E8E8' },
  tabChipActive: { backgroundColor: '#667eea' },
  tabChipText: { fontSize: 14, color: '#666', fontWeight: '500' },
  tabChipTextActive: { color: '#fff', fontWeight: '700' },
  scrollView: { flex: 1 },
  sectionContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  summaryCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  summaryGradient: { padding: 24 },
  summaryContent: {},
  summaryMainStat: { alignItems: 'center', marginBottom: 20 },
  summaryValue: { fontSize: 48, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  summaryStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  medCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  medCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  medCategoryIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  medCardTitleSection: { flex: 1, marginLeft: 12 },
  medCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medCardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  medCardGeneric: { fontSize: 12, color: '#999', marginTop: 1 },
  medCardDosage: { fontSize: 12, color: '#666', marginTop: 2 },
  allTakenBadge: {},
  doseScheduleRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12 },
  doseSlot: { alignItems: 'center', gap: 6 },
  doseTime: { fontSize: 11, color: '#666', fontWeight: '500' },
  pillIndicator: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  adherenceContainer: { alignItems: 'center' },
  adherenceRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  adherenceProgress: { position: 'absolute', width: '100%', height: '100%', borderRadius: 25, borderWidth: 4 },
  adherenceText: { fontSize: 12, fontWeight: '800' },
  adherenceLabel: { fontSize: 9, color: '#999', marginTop: 2 },
  medProgressBar: { height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  medProgressFill: { height: '100%', borderRadius: 2 },
  medProgressText: { fontSize: 11, color: '#999', textAlign: 'center' },
  medExpandedSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  medDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  medDetailLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  medDetailValue: { fontSize: 12, color: '#333', flex: 1 },
  instructionsBox: { flexDirection: 'row', backgroundColor: '#E3F2FD', borderRadius: 8, padding: 12, marginVertical: 8, gap: 8 },
  instructionsText: { fontSize: 12, color: '#1565C0', flex: 1, lineHeight: 18 },
  sideEffectsSection: { marginTop: 8 },
  sideEffectsTitle: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  sideEffectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sideEffectTag: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  sideEffectText: { fontSize: 11, color: '#FF9800', fontWeight: '500' },
  interactionsSection: { marginTop: 12 },
  interactionsTitle: { fontSize: 13, fontWeight: '600', color: '#FF9800', marginBottom: 6 },
  interactionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  interactionText: { fontSize: 12, color: '#666', flex: 1 },
  medActionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  medActionButton: { alignItems: 'center', backgroundColor: '#F0F4FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 4 },
  medActionText: { fontSize: 11, fontWeight: '600', color: '#667eea' },
  timelineContainer: { marginTop: 8 },
  timelineItem: { flexDirection: 'row' },
  timelineLine: { width: 24, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineConnector: { width: 2, flex: 1, backgroundColor: '#E0E0E0' },
  reminderCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginLeft: 12, marginBottom: 8 },
  reminderCardContent: { flexDirection: 'row', alignItems: 'center' },
  reminderTimeSection: { alignItems: 'center', marginRight: 12 },
  reminderTime: { fontSize: 12, fontWeight: '600', color: '#333' },
  reminderStatusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  reminderInfo: { flex: 1 },
  reminderMedName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  reminderDosage: { fontSize: 12, color: '#999' },
  reminderActions: { flexDirection: 'row', gap: 8 },
  reminderActionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  weeklyChart: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  chartBarColumn: { alignItems: 'center' },
  chartBarValue: { fontSize: 9, color: '#999', marginBottom: 4 },
  chartBarTrack: { width: 20, height: 80, backgroundColor: '#F0F0F0', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBarFill: { width: '100%', borderRadius: 10 },
  chartBarLabel: { fontSize: 10, color: '#999', marginTop: 4 },
  historyEntry: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  historyEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  historyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  historyBadgeText: { fontSize: 12, fontWeight: '700' },
  historyProgressBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  historyProgressFill: { height: '100%', borderRadius: 3 },
  historyNotes: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  pharmacyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  pharmacyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pharmacyInfo: { marginLeft: 12, flex: 1 },
  pharmacyName: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  deliveryText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  pharmacyDetails: { marginBottom: 16 },
  pharmacyDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pharmacyDetailText: { fontSize: 13, color: '#666', flex: 1 },
  pharmacyActions: { flexDirection: 'row', justifyContent: 'space-around' },
  pharmacyActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  pharmacyActionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  refillCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  refillCardUrgent: { borderWidth: 1, borderColor: '#F4433630' },
  refillCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  refillInfo: { flex: 1, marginLeft: 8 },
  refillMedName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  refillDate: { fontSize: 12, color: '#999', marginTop: 2 },
  refillCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  refillCountText: { fontSize: 11, fontWeight: '700' },
  refillButton: { backgroundColor: '#667eea', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  refillButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});

export default MedicationManagementScreen;
