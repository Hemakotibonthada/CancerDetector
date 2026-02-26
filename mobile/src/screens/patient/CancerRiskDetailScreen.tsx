/**
 * CancerRiskDetailScreen - Detailed cancer risk assessment results
 * Shows risk scores, contributing factors, recommendations, and trends
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface RiskFactor {
  name: string;
  impact: 'high' | 'moderate' | 'low';
  score: number;
  description: string;
  modifiable: boolean;
  category: 'genetic' | 'lifestyle' | 'environmental' | 'medical' | 'demographic';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'screening' | 'lifestyle' | 'medication' | 'consultation';
  completed: boolean;
}

interface TrendPoint {
  date: string;
  score: number;
  label?: string;
}

interface CancerRiskData {
  cancerType: string;
  overallRisk: number;
  riskLevel: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  confidenceInterval: [number, number];
  assessmentDate: string;
  nextAssessmentDate: string;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  trends: TrendPoint[];
  populationAverage: number;
  ageGroupAverage: number;
  geneticRisk: number;
  lifestyleRisk: number;
  environmentalRisk: number;
  modelVersion: string;
}

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
    riskVeryLow: '#2e7d32',
    riskLow: '#4caf50',
    riskModerate: '#ff9800',
    riskHigh: '#f44336',
    riskVeryHigh: '#b71c1c',
    cardShadow: 'rgba(0,0,0,0.08)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
};

// ============================================================================
// Mock Data Generator
// ============================================================================

const generateMockData = (cancerType: string = 'Breast Cancer'): CancerRiskData => ({
  cancerType,
  overallRisk: 23.5,
  riskLevel: 'moderate',
  confidenceInterval: [18.2, 28.8],
  assessmentDate: '2024-01-15',
  nextAssessmentDate: '2024-07-15',
  populationAverage: 12.4,
  ageGroupAverage: 15.8,
  geneticRisk: 35,
  lifestyleRisk: 18,
  environmentalRisk: 12,
  modelVersion: '2.3.1',
  riskFactors: [
    { name: 'Family History', impact: 'high', score: 35, description: 'First-degree relative with breast cancer', modifiable: false, category: 'genetic' },
    { name: 'BRCA1 Variant', impact: 'high', score: 28, description: 'Pathogenic variant detected in BRCA1 gene', modifiable: false, category: 'genetic' },
    { name: 'BMI', impact: 'moderate', score: 15, description: 'BMI of 28.5 - above recommended range', modifiable: true, category: 'lifestyle' },
    { name: 'Physical Activity', impact: 'moderate', score: 12, description: 'Below recommended weekly activity level', modifiable: true, category: 'lifestyle' },
    { name: 'Alcohol Consumption', impact: 'low', score: 8, description: 'Moderate alcohol intake detected', modifiable: true, category: 'lifestyle' },
    { name: 'Hormone Therapy', impact: 'moderate', score: 18, description: 'Current HRT use increases risk', modifiable: true, category: 'medical' },
    { name: 'Age', impact: 'moderate', score: 20, description: 'Age-related increased risk factor', modifiable: false, category: 'demographic' },
    { name: 'Radiation Exposure', impact: 'low', score: 5, description: 'Previous chest radiation therapy', modifiable: false, category: 'environmental' },
  ],
  recommendations: [
    { id: 'r1', title: 'Genetic Counseling', description: 'Schedule consultation with a certified genetic counselor to discuss BRCA1 implications', priority: 'urgent', category: 'consultation', completed: false },
    { id: 'r2', title: 'Annual MRI Screening', description: 'Enhanced screening with breast MRI recommended due to high genetic risk', priority: 'high', category: 'screening', completed: false },
    { id: 'r3', title: 'Mammography Schedule', description: 'Biannual mammography starting at age 30, alternating with MRI', priority: 'high', category: 'screening', completed: true },
    { id: 'r4', title: 'Increase Physical Activity', description: 'Aim for 150+ minutes of moderate exercise per week', priority: 'medium', category: 'lifestyle', completed: false },
    { id: 'r5', title: 'Weight Management', description: 'Work towards BMI under 25 through diet and exercise plan', priority: 'medium', category: 'lifestyle', completed: false },
    { id: 'r6', title: 'HRT Review', description: 'Discuss hormone replacement therapy alternatives with gynecologist', priority: 'high', category: 'medication', completed: false },
    { id: 'r7', title: 'Reduce Alcohol', description: 'Limit alcohol to fewer than 3 drinks per week', priority: 'low', category: 'lifestyle', completed: false },
    { id: 'r8', title: 'Chemoprevention Discussion', description: 'Discuss tamoxifen or raloxifene options with oncologist', priority: 'medium', category: 'medication', completed: false },
  ],
  trends: [
    { date: '2022-01', score: 19.2, label: 'Initial Assessment' },
    { date: '2022-07', score: 20.1 },
    { date: '2023-01', score: 21.8 },
    { date: '2023-07', score: 22.5, label: 'Genetic Testing' },
    { date: '2024-01', score: 23.5, label: 'Current' },
  ],
});

// ============================================================================
// Helper Functions
// ============================================================================

const getRiskColor = (level: string): string => {
  const map: Record<string, string> = {
    very_low: theme.colors.riskVeryLow,
    low: theme.colors.riskLow,
    moderate: theme.colors.riskModerate,
    high: theme.colors.riskHigh,
    very_high: theme.colors.riskVeryHigh,
  };
  return map[level] || theme.colors.textSecondary;
};

const getRiskLabel = (level: string): string => {
  const map: Record<string, string> = {
    very_low: 'Very Low',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    very_high: 'Very High',
  };
  return map[level] || 'Unknown';
};

const getImpactColor = (impact: string): string => {
  const map: Record<string, string> = {
    high: theme.colors.error,
    moderate: theme.colors.warning,
    low: theme.colors.info,
  };
  return map[impact] || theme.colors.textSecondary;
};

const getPriorityColor = (priority: string): string => {
  const map: Record<string, string> = {
    urgent: theme.colors.riskVeryHigh,
    high: theme.colors.error,
    medium: theme.colors.warning,
    low: theme.colors.info,
  };
  return map[priority] || theme.colors.textSecondary;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ============================================================================
// Sub-Components
// ============================================================================

const AnimatedRiskGauge: React.FC<{ risk: number; level: string }> = ({ risk, level }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: risk / 100,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [risk]);

  const riskColor = getRiskColor(level);
  const riskColorInterp = animatedValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      theme.colors.riskVeryLow,
      theme.colors.riskLow,
      theme.colors.riskModerate,
      theme.colors.warning,
      theme.colors.riskHigh,
      theme.colors.riskVeryHigh,
    ],
  });

  const gaugeWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.gaugeContainer}>
      <Animated.View style={[styles.gaugeCenter, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[styles.gaugeScore, { color: riskColor }]}>{risk.toFixed(1)}%</Text>
        <Text style={[styles.gaugeLabel, { color: riskColor }]}>{getRiskLabel(level)}</Text>
      </Animated.View>

      <View style={styles.gaugeBarContainer}>
        <Animated.View
          style={[styles.gaugeBar, { width: gaugeWidth, backgroundColor: riskColorInterp }]}
        />
        <View style={styles.gaugeMarkers}>
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <Text key={v} style={styles.gaugeMarkerText}>
              {v}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const RiskFactorCard: React.FC<{ factor: RiskFactor; index: number }> = ({ factor, index }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const impactColor = getImpactColor(factor.impact);

  const categoryIcons: Record<string, string> = {
    genetic: '🧬',
    lifestyle: '🏃',
    environmental: '🌍',
    medical: '💊',
    demographic: '👤',
  };

  return (
    <Animated.View
      style={[
        styles.riskFactorCard,
        { transform: [{ translateX: slideAnim }], opacity: fadeAnim },
      ]}
    >
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.riskFactorHeader}>
          <View style={styles.riskFactorLeft}>
            <Text style={styles.riskFactorIcon}>{categoryIcons[factor.category] || '📊'}</Text>
            <View>
              <Text style={styles.riskFactorName}>{factor.name}</Text>
              <View style={styles.riskFactorTags}>
                <View style={[styles.impactBadge, { backgroundColor: impactColor + '20' }]}>
                  <Text style={[styles.impactBadgeText, { color: impactColor }]}>
                    {factor.impact.toUpperCase()}
                  </Text>
                </View>
                {factor.modifiable && (
                  <View style={[styles.modifiableBadge]}>
                    <Text style={styles.modifiableBadgeText}>Modifiable</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.riskFactorRight}>
            <Text style={[styles.riskFactorScore, { color: impactColor }]}>{factor.score}%</Text>
            <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.riskFactorDetails}>
            <Text style={styles.riskFactorDescription}>{factor.description}</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  { width: `${factor.score}%`, backgroundColor: impactColor },
                ]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const RecommendationCard: React.FC<{
  recommendation: Recommendation;
  onToggle: (id: string) => void;
  index: number;
}> = ({ recommendation, onToggle, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const priorityColor = getPriorityColor(recommendation.priority);

  const categoryIcons: Record<string, string> = {
    screening: '🔍',
    lifestyle: '🥗',
    medication: '💊',
    consultation: '👨‍⚕️',
  };

  return (
    <Animated.View
      style={[
        styles.recommendationCard,
        recommendation.completed && styles.recommendationCompleted,
        { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
      ]}
    >
      <TouchableOpacity onPress={() => onToggle(recommendation.id)} activeOpacity={0.7}>
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationLeft}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                recommendation.completed && styles.checkboxChecked,
              ]}
              onPress={() => onToggle(recommendation.id)}
            >
              {recommendation.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.recommendationIcon}>
              {categoryIcons[recommendation.category] || '📋'}
            </Text>
          </View>
          <View style={styles.recommendationContent}>
            <View style={styles.recommendationTitleRow}>
              <Text
                style={[
                  styles.recommendationTitle,
                  recommendation.completed && styles.recommendationTitleCompleted,
                ]}
              >
                {recommendation.title}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                  {recommendation.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.recommendationDescription}>{recommendation.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ComparisonBar: React.FC<{
  label: string;
  value: number;
  reference: number;
  refLabel: string;
  color: string;
}> = ({ label, value, reference, refLabel, color }) => {
  const maxVal = Math.max(value, reference) * 1.3;
  const valueWidth = (value / maxVal) * 100;
  const refWidth = (reference / maxVal) * 100;

  return (
    <View style={styles.comparisonItem}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      <View style={styles.comparisonBars}>
        <View style={styles.barRow}>
          <View style={[styles.comparisonBar, { width: `${valueWidth}%`, backgroundColor: color }]} />
          <Text style={styles.barValue}>{value.toFixed(1)}%</Text>
        </View>
        <View style={styles.barRow}>
          <View
            style={[
              styles.comparisonBar,
              { width: `${refWidth}%`, backgroundColor: theme.colors.textLight },
            ]}
          />
          <Text style={styles.barValue}>
            {reference.toFixed(1)}% ({refLabel})
          </Text>
        </View>
      </View>
    </View>
  );
};

const TrendChart: React.FC<{ trends: TrendPoint[] }> = ({ trends }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  if (trends.length < 2) return null;

  const minScore = Math.min(...trends.map((t) => t.score)) - 5;
  const maxScore = Math.max(...trends.map((t) => t.score)) + 5;
  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = 120;

  return (
    <Animated.View style={[styles.trendChartContainer, { opacity: fadeAnim }]}>
      <View style={[styles.trendChart, { height: chartHeight }]}>
        {trends.map((point, i) => {
          const x = (i / (trends.length - 1)) * (chartWidth - 20);
          const y = chartHeight - ((point.score - minScore) / (maxScore - minScore)) * chartHeight;

          return (
            <View key={i}>
              <View
                style={[
                  styles.trendDot,
                  {
                    left: x + 5,
                    top: y - 6,
                    backgroundColor: i === trends.length - 1 ? theme.colors.primary : theme.colors.primaryLight,
                  },
                ]}
              />
              <Text
                style={[styles.trendScore, { left: x - 5, top: y - 22 }]}
              >
                {point.score.toFixed(1)}
              </Text>
              <Text style={[styles.trendDate, { left: x - 10, top: chartHeight + 4 }]}>
                {point.date}
              </Text>
              {point.label && (
                <Text
                  style={[styles.trendLabel, { left: x - 15, top: chartHeight + 18 }]}
                >
                  {point.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const RiskBreakdownSection: React.FC<{
  genetic: number;
  lifestyle: number;
  environmental: number;
}> = ({ genetic, lifestyle, environmental }) => {
  const total = genetic + lifestyle + environmental;
  const segments = [
    { label: 'Genetic', value: genetic, color: theme.colors.accent, icon: '🧬' },
    { label: 'Lifestyle', value: lifestyle, color: theme.colors.warning, icon: '🏃' },
    { label: 'Environmental', value: environmental, color: theme.colors.secondary, icon: '🌍' },
  ];

  return (
    <View style={styles.breakdownContainer}>
      <View style={styles.breakdownBarContainer}>
        {segments.map((seg, i) => (
          <View
            key={i}
            style={[
              styles.breakdownSegment,
              {
                width: `${(seg.value / total) * 100}%`,
                backgroundColor: seg.color,
                borderTopLeftRadius: i === 0 ? theme.borderRadius.sm : 0,
                borderBottomLeftRadius: i === 0 ? theme.borderRadius.sm : 0,
                borderTopRightRadius: i === segments.length - 1 ? theme.borderRadius.sm : 0,
                borderBottomRightRadius: i === segments.length - 1 ? theme.borderRadius.sm : 0,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.breakdownLegend}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <Text style={styles.legendIcon}>{seg.icon}</Text>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.legendLabel}>{seg.label}</Text>
            <Text style={[styles.legendValue, { color: seg.color }]}>
              {((seg.value / total) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// Main Screen
// ============================================================================

const CancerRiskDetailScreen: React.FC<{ route?: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const [data, setData] = useState<CancerRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'factors' | 'recommendations' | 'trends'>('factors');
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  const cancerType = route?.params?.cancerType || 'Breast Cancer';

  const loadData = useCallback(async () => {
    try {
      await new Promise((r) => setTimeout(r, 800));
      setData(generateMockData(cancerType));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cancerType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleRecommendation = (id: string) => {
    if (!data) return;
    setData({
      ...data,
      recommendations: data.recommendations.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      ),
    });
  };

  const handleShare = async () => {
    if (!data) return;
    try {
      await Share.share({
        title: `${data.cancerType} Risk Assessment`,
        message: `My ${data.cancerType} risk assessment: ${data.overallRisk.toFixed(1)}% (${getRiskLabel(data.riskLevel)}). Assessment by CancerGuard AI.`,
      });
    } catch {
      // Share cancelled
    }
  };

  const handleTabChange = (tab: 'factors' | 'recommendations' | 'trends') => {
    const tabIndex = { factors: 0, recommendations: 1, trends: 2 }[tab];
    Animated.spring(tabAnim, { toValue: tabIndex, useNativeDriver: true, friction: 10 }).start();
    setActiveTab(tab);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Analyzing risk factors...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Unable to load risk assessment</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedRecs = data.recommendations.filter((r) => r.completed).length;
  const totalRecs = data.recommendations.length;

  const tabIndicatorTranslate = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, (SCREEN_WIDTH - 32) / 3, ((SCREEN_WIDTH - 32) / 3) * 2],
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header Section */}
        <Animated.View style={[styles.headerSection, { opacity: headerOpacity }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.cancerTypeTitle}>{data.cancerType}</Text>
              <Text style={styles.assessmentDate}>
                Assessed: {formatDate(data.assessmentDate)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>

          {/* Risk Gauge */}
          <AnimatedRiskGauge risk={data.overallRisk} level={data.riskLevel} />

          {/* Confidence Interval */}
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>95% Confidence Interval</Text>
            <Text style={styles.confidenceValue}>
              {data.confidenceInterval[0].toFixed(1)}% – {data.confidenceInterval[1].toFixed(1)}%
            </Text>
          </View>

          {/* Model Info */}
          <Text style={styles.modelInfo}>AI Model v{data.modelVersion}</Text>
        </Animated.View>

        {/* Risk Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Risk Composition</Text>
          <RiskBreakdownSection
            genetic={data.geneticRisk}
            lifestyle={data.lifestyleRisk}
            environmental={data.environmentalRisk}
          />
        </View>

        {/* Population Comparison */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Comparison</Text>
          <ComparisonBar
            label="Your Risk"
            value={data.overallRisk}
            reference={data.populationAverage}
            refLabel="Population Avg"
            color={getRiskColor(data.riskLevel)}
          />
          <ComparisonBar
            label="Your Risk"
            value={data.overallRisk}
            reference={data.ageGroupAverage}
            refLabel="Age Group Avg"
            color={getRiskColor(data.riskLevel)}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {(['factors', 'recommendations', 'trends'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tab}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, activeTab === tab && styles.activeTabText]}
                >
                  {tab === 'factors'
                    ? `Factors (${data.riskFactors.length})`
                    : tab === 'recommendations'
                    ? `Actions (${completedRecs}/${totalRecs})`
                    : 'Trends'}
                </Text>
              </TouchableOpacity>
            ))}
            <Animated.View
              style={[
                styles.tabIndicator,
                { transform: [{ translateX: tabIndicatorTranslate }] },
              ]}
            />
          </View>

          {/* Tab Content */}
          {activeTab === 'factors' && (
            <View style={styles.tabContent}>
              {data.riskFactors
                .sort((a, b) => b.score - a.score)
                .map((factor, index) => (
                  <RiskFactorCard key={factor.name} factor={factor} index={index} />
                ))}
            </View>
          )}

          {activeTab === 'recommendations' && (
            <View style={styles.tabContent}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(completedRecs / totalRecs) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedRecs} of {totalRecs} completed
                </Text>
              </View>

              {data.recommendations
                .sort((a, b) => {
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                  if (a.completed !== b.completed) return a.completed ? 1 : -1;
                  return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
                })
                .map((rec, index) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onToggle={toggleRecommendation}
                    index={index}
                  />
                ))}
            </View>
          )}

          {activeTab === 'trends' && (
            <View style={styles.tabContent}>
              <TrendChart trends={data.trends} />
              <View style={styles.trendSummary}>
                <View style={styles.trendSummaryItem}>
                  <Text style={styles.trendSummaryLabel}>Change (12 months)</Text>
                  <Text style={[styles.trendSummaryValue, { color: theme.colors.warning }]}>
                    +{(data.trends[data.trends.length - 1].score - data.trends[data.trends.length - 2].score).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.trendSummaryItem}>
                  <Text style={styles.trendSummaryLabel}>Total Change</Text>
                  <Text style={[styles.trendSummaryValue, { color: theme.colors.error }]}>
                    +{(data.trends[data.trends.length - 1].score - data.trends[0].score).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.trendSummaryItem}>
                  <Text style={styles.trendSummaryLabel}>Next Assessment</Text>
                  <Text style={styles.trendSummaryValue}>
                    {formatDate(data.nextAssessmentDate)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => Alert.alert('Appointment', 'Schedule a consultation with your oncologist?')}
          >
            <Text style={styles.primaryButtonText}>Schedule Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Report', 'Full PDF report will be generated and sent to your email.')}
          >
            <Text style={styles.secondaryButtonText}>Download Report</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            ⚠️ This risk assessment is generated by an AI model and should not be used as a
            substitute for professional medical advice. Please consult with your healthcare
            provider for clinical decisions. The model considers multiple factors but may not
            capture all individual risk variables.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  headerSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  cancerTypeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  assessmentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + '10',
  },
  shareButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Gauge
  gaugeContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  gaugeCenter: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  gaugeScore: {
    fontSize: 48,
    fontWeight: '800',
  },
  gaugeLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  gaugeBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  gaugeBar: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  gaugeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gaugeMarkerText: {
    fontSize: 10,
    color: theme.colors.textLight,
  },

  // Confidence
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  confidenceLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modelInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
  },

  // Section Card
  sectionCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  // Breakdown
  breakdownContainer: {
    marginTop: theme.spacing.sm,
  },
  breakdownBarContainer: {
    flexDirection: 'row',
    height: 24,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Comparison
  comparisonItem: {
    marginBottom: theme.spacing.md,
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  comparisonBars: {
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonBar: {
    height: 14,
    borderRadius: theme.borderRadius.sm,
  },
  barValue: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },

  // Tabs
  tabContainer: {
    margin: theme.spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: (SCREEN_WIDTH - 32 - 8) / 3,
    height: '100%',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
  },
  tabContent: {
    marginTop: theme.spacing.md,
  },

  // Risk Factor Cards
  riskFactorCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  riskFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskFactorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riskFactorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  riskFactorName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  riskFactorTags: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modifiableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.secondary + '20',
  },
  modifiableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  riskFactorRight: {
    alignItems: 'flex-end',
  },
  riskFactorScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  expandIcon: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  riskFactorDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  riskFactorDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  scoreBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Recommendation Cards
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  recommendationCompleted: {
    opacity: 0.6,
    borderLeftColor: theme.colors.success,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  recommendationIcon: {
    fontSize: 20,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  recommendationTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  recommendationDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },

  // Progress
  progressContainer: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Trend Chart
  trendChartContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  trendChart: {
    position: 'relative',
    marginBottom: 32,
  },
  trendDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  trendScore: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
  },
  trendDate: {
    position: 'absolute',
    fontSize: 8,
    color: theme.colors.textLight,
  },
  trendLabel: {
    position: 'absolute',
    fontSize: 8,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  trendSummary: {
    marginTop: theme.spacing.md,
    gap: 12,
  },
  trendSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  trendSummaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  trendSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Action Buttons
  actionButtons: {
    padding: theme.spacing.md,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    elevation: 3,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Disclaimer
  disclaimerContainer: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warning + '10',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  disclaimerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default CancerRiskDetailScreen;
