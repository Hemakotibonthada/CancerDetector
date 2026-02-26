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
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== Types ====================
interface NutrientInfo {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: string;
}

interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  time: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image?: string;
  ingredients: string[];
  cancerFightingScore: number;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  category: string;
  cancerFightingProperties: string[];
  antioxidantLevel: 'low' | 'moderate' | 'high' | 'very_high';
  antiInflammatory: boolean;
}

interface WaterIntake {
  current: number;
  target: number;
  entries: { time: string; amount: number }[];
}

interface NutritionPlan {
  id: string;
  name: string;
  description: string;
  dailyCalories: number;
  macroSplit: { protein: number; carbs: number; fat: number };
  specialFocus: string[];
  cancerType?: string;
  createdBy: string;
}

// ==================== Animated Progress Ring ====================
const ProgressRing: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, color, backgroundColor = '#E8E8E8', children }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(progress, 1),
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: backgroundColor,
        position: 'absolute',
      }} />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: progress > 0.25 ? color : 'transparent',
          borderBottomColor: progress > 0.5 ? color : 'transparent',
          borderLeftColor: progress > 0.75 ? color : 'transparent',
          position: 'absolute',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {children}
    </View>
  );
};

// ==================== Nutrient Bar ====================
const NutrientBar: React.FC<{ nutrient: NutrientInfo }> = ({ nutrient }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((nutrient.current / nutrient.target) * 100, 100);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const widthInterpolation = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.nutrientBarContainer}>
      <View style={styles.nutrientBarHeader}>
        <View style={styles.nutrientBarLabelRow}>
          <MaterialCommunityIcons name={nutrient.icon as any} size={16} color={nutrient.color} />
          <Text style={styles.nutrientBarLabel}>{nutrient.name}</Text>
        </View>
        <Text style={styles.nutrientBarValue}>
          {nutrient.current}{nutrient.unit} / {nutrient.target}{nutrient.unit}
        </Text>
      </View>
      <View style={styles.nutrientBarTrack}>
        <Animated.View
          style={[
            styles.nutrientBarFill,
            {
              width: widthInterpolation,
              backgroundColor: nutrient.color,
            },
          ]}
        />
      </View>
    </View>
  );
};

// ==================== Meal Card ====================
const MealCard: React.FC<{
  meal: MealEntry;
  onPress: () => void;
  index: number;
}> = ({ meal, onPress, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getMealIcon = () => {
    switch (meal.mealType) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'restaurant-outline';
      case 'dinner': return 'moon-outline';
      case 'snack': return 'cafe-outline';
    }
  };

  const getMealColor = () => {
    switch (meal.mealType) {
      case 'breakfast': return '#FF9800';
      case 'lunch': return '#4CAF50';
      case 'dinner': return '#2196F3';
      case 'snack': return '#9C27B0';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.mealCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.mealCardHeader}>
          <View style={[styles.mealTypeIcon, { backgroundColor: getMealColor() + '20' }]}>
            <Ionicons name={getMealIcon() as any} size={20} color={getMealColor()} />
          </View>
          <View style={styles.mealCardTitleSection}>
            <Text style={styles.mealCardTitle}>{meal.name}</Text>
            <Text style={styles.mealCardTime}>{meal.time}</Text>
          </View>
          <View style={[styles.cancerScoreBadge, { backgroundColor: getScoreColor(meal.cancerFightingScore) + '20' }]}>
            <Text style={[styles.cancerScoreText, { color: getScoreColor(meal.cancerFightingScore) }]}>
              {meal.cancerFightingScore}
            </Text>
            <MaterialCommunityIcons name="shield-check" size={12} color={getScoreColor(meal.cancerFightingScore)} />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{meal.calories}</Text>
            <Text style={styles.macroLabel}>kcal</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#E91E63' }]}>{meal.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#FF9800' }]}>{meal.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#2196F3' }]}>{meal.fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        {meal.ingredients.length > 0 && (
          <View style={styles.ingredientTags}>
            {meal.ingredients.slice(0, 4).map((ingredient, idx) => (
              <View key={idx} style={styles.ingredientTag}>
                <Text style={styles.ingredientTagText}>{ingredient}</Text>
              </View>
            ))}
            {meal.ingredients.length > 4 && (
              <View style={styles.ingredientTag}>
                <Text style={styles.ingredientTagText}>+{meal.ingredients.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== Water Tracker ====================
const WaterTracker: React.FC<{
  waterIntake: WaterIntake;
  onAddWater: (amount: number) => void;
}> = ({ waterIntake, onAddWater }) => {
  const progress = waterIntake.current / waterIntake.target;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const waterAmounts = [100, 200, 250, 500];

  return (
    <View style={styles.waterTrackerCard}>
      <View style={styles.waterTrackerHeader}>
        <Ionicons name="water" size={24} color="#2196F3" />
        <Text style={styles.waterTrackerTitle}>Water Intake</Text>
        <Text style={styles.waterTrackerProgress}>
          {waterIntake.current}ml / {waterIntake.target}ml
        </Text>
      </View>

      <View style={styles.waterGlassContainer}>
        <View style={styles.waterGlass}>
          <View style={[styles.waterFill, { height: `${Math.min(progress * 100, 100)}%` as any }]} />
          <Text style={styles.waterPercentage}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      <View style={styles.waterButtonRow}>
        {waterAmounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.waterButton}
            onPress={() => onAddWater(amount)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#2196F3" />
            <Text style={styles.waterButtonText}>{amount}ml</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ==================== Food Search Modal ====================
const FoodSearchModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem) => void;
}> = ({ visible, onClose, onSelectFood }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const categories = ['all', 'fruits', 'vegetables', 'proteins', 'grains', 'dairy', 'supplements'];

  const sampleFoods: FoodItem[] = useMemo(() => [
    {
      id: '1', name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4,
      servingSize: '100g', category: 'fruits',
      cancerFightingProperties: ['Anthocyanins', 'Vitamin C', 'Pterostilbene'],
      antioxidantLevel: 'very_high', antiInflammatory: true,
    },
    {
      id: '2', name: 'Broccoli', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6,
      servingSize: '100g', category: 'vegetables',
      cancerFightingProperties: ['Sulforaphane', 'Indole-3-carbinol', 'Vitamin C'],
      antioxidantLevel: 'very_high', antiInflammatory: true,
    },
    {
      id: '3', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0,
      servingSize: '100g', category: 'proteins',
      cancerFightingProperties: ['Omega-3 fatty acids', 'Vitamin D', 'Selenium'],
      antioxidantLevel: 'moderate', antiInflammatory: true,
    },
    {
      id: '4', name: 'Turmeric', calories: 312, protein: 9.7, carbs: 67.1, fat: 3.3, fiber: 22.7,
      servingSize: '100g', category: 'supplements',
      cancerFightingProperties: ['Curcumin', 'Anti-inflammatory', 'Antioxidant'],
      antioxidantLevel: 'very_high', antiInflammatory: true,
    },
    {
      id: '5', name: 'Green Tea', calories: 1, protein: 0.2, carbs: 0, fat: 0, fiber: 0,
      servingSize: '240ml', category: 'supplements',
      cancerFightingProperties: ['EGCG', 'Catechins', 'Polyphenols'],
      antioxidantLevel: 'very_high', antiInflammatory: true,
    },
    {
      id: '6', name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2,
      servingSize: '100g', category: 'vegetables',
      cancerFightingProperties: ['Folate', 'Lutein', 'Kaempferol'],
      antioxidantLevel: 'high', antiInflammatory: true,
    },
    {
      id: '7', name: 'Walnuts', calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7,
      servingSize: '100g', category: 'proteins',
      cancerFightingProperties: ['Ellagic acid', 'Omega-3', 'Melatonin'],
      antioxidantLevel: 'high', antiInflammatory: true,
    },
    {
      id: '8', name: 'Garlic', calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1,
      servingSize: '100g', category: 'vegetables',
      cancerFightingProperties: ['Allicin', 'Diallyl disulfide', 'S-allylcysteine'],
      antioxidantLevel: 'high', antiInflammatory: true,
    },
    {
      id: '9', name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8,
      servingSize: '100g (cooked)', category: 'grains',
      cancerFightingProperties: ['Quercetin', 'Kaempferol', 'Complete protein'],
      antioxidantLevel: 'moderate', antiInflammatory: true,
    },
    {
      id: '10', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0,
      servingSize: '100g', category: 'dairy',
      cancerFightingProperties: ['Probiotics', 'Calcium', 'Conjugated linoleic acid'],
      antioxidantLevel: 'low', antiInflammatory: false,
    },
  ], []);

  const filteredFoods = useMemo(() => {
    return sampleFoods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, sampleFoods]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getAntioxidantColor = (level: string) => {
    switch (level) {
      case 'very_high': return '#4CAF50';
      case 'high': return '#8BC34A';
      case 'moderate': return '#FF9800';
      case 'low': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodSearchItem}
      onPress={() => onSelectFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodSearchItemHeader}>
        <Text style={styles.foodSearchItemName}>{item.name}</Text>
        <View style={[styles.antioxidantBadge, { backgroundColor: getAntioxidantColor(item.antioxidantLevel) + '20' }]}>
          <Text style={[styles.antioxidantText, { color: getAntioxidantColor(item.antioxidantLevel) }]}>
            {item.antioxidantLevel.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={styles.foodSearchServing}>{item.servingSize}</Text>
      <View style={styles.foodSearchMacros}>
        <Text style={styles.foodSearchMacro}>{item.calories} kcal</Text>
        <Text style={styles.foodSearchMacro}>P: {item.protein}g</Text>
        <Text style={styles.foodSearchMacro}>C: {item.carbs}g</Text>
        <Text style={styles.foodSearchMacro}>F: {item.fat}g</Text>
      </View>
      {item.cancerFightingProperties.length > 0 && (
        <View style={styles.cancerFightingProps}>
          {item.cancerFightingProperties.map((prop, idx) => (
            <View key={idx} style={styles.propTag}>
              <MaterialCommunityIcons name="shield-star" size={10} color="#4CAF50" />
              <Text style={styles.propTagText}>{prop}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.foodSearchModal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.foodSearchModalHeader}>
            <Text style={styles.foodSearchModalTitle}>Search Foods</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cancer-fighting foods..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredFoods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.foodSearchList}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// ==================== Main NutritionScreen ====================
const NutritionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'today' | 'plan' | 'insights'>('today');
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const nutrients: NutrientInfo[] = useMemo(() => [
    { name: 'Calories', current: 1450, target: 2000, unit: 'kcal', color: '#FF5722', icon: 'fire' },
    { name: 'Protein', current: 78, target: 120, unit: 'g', color: '#E91E63', icon: 'food-steak' },
    { name: 'Carbs', current: 165, target: 250, unit: 'g', color: '#FF9800', icon: 'barley' },
    { name: 'Fat', current: 52, target: 65, unit: 'g', color: '#2196F3', icon: 'water' },
    { name: 'Fiber', current: 22, target: 30, unit: 'g', color: '#4CAF50', icon: 'leaf' },
    { name: 'Vitamin C', current: 85, target: 90, unit: 'mg', color: '#FFC107', icon: 'fruit-citrus' },
    { name: 'Vitamin D', current: 12, target: 20, unit: 'μg', color: '#9C27B0', icon: 'white-balance-sunny' },
    { name: 'Iron', current: 14, target: 18, unit: 'mg', color: '#795548', icon: 'magnet' },
  ], []);

  const meals: MealEntry[] = useMemo(() => [
    {
      id: '1', name: 'Berry Antioxidant Smoothie', calories: 320, protein: 18, carbs: 42, fat: 8,
      fiber: 6, time: '7:30 AM', mealType: 'breakfast',
      ingredients: ['Blueberries', 'Spinach', 'Greek Yogurt', 'Chia Seeds', 'Flaxseed'],
      cancerFightingScore: 92,
    },
    {
      id: '2', name: 'Grilled Salmon & Quinoa Bowl', calories: 580, protein: 35, carbs: 48, fat: 22,
      fiber: 8, time: '12:30 PM', mealType: 'lunch',
      ingredients: ['Salmon', 'Quinoa', 'Broccoli', 'Avocado', 'Turmeric Dressing'],
      cancerFightingScore: 95,
    },
    {
      id: '3', name: 'Green Tea & Walnuts', calories: 200, protein: 5, carbs: 8, fat: 16,
      fiber: 2, time: '3:00 PM', mealType: 'snack',
      ingredients: ['Green Tea', 'Walnuts', 'Dark Chocolate'],
      cancerFightingScore: 85,
    },
    {
      id: '4', name: 'Garlic Herb Chicken with Vegetables', calories: 350, protein: 30, carbs: 25, fat: 12,
      fiber: 6, time: '7:00 PM', mealType: 'dinner',
      ingredients: ['Chicken Breast', 'Garlic', 'Sweet Potato', 'Brussels Sprouts', 'Olive Oil'],
      cancerFightingScore: 88,
    },
  ], []);

  const [waterIntake, setWaterIntake] = useState<WaterIntake>({
    current: 1200,
    target: 2500,
    entries: [
      { time: '7:00 AM', amount: 250 },
      { time: '9:30 AM', amount: 200 },
      { time: '11:00 AM', amount: 250 },
      { time: '1:00 PM', amount: 300 },
      { time: '3:30 PM', amount: 200 },
    ],
  });

  const nutritionPlans: NutritionPlan[] = useMemo(() => [
    {
      id: '1', name: 'Anti-Cancer Nutrition Plan',
      description: 'Focused on antioxidant-rich foods and anti-inflammatory ingredients',
      dailyCalories: 2000, macroSplit: { protein: 30, carbs: 45, fat: 25 },
      specialFocus: ['Antioxidants', 'Anti-inflammatory', 'Immune boosting'],
      cancerType: 'General Prevention', createdBy: 'Dr. Sarah Johnson',
    },
    {
      id: '2', name: 'Post-Treatment Recovery',
      description: 'High protein diet to support tissue repair and immune recovery',
      dailyCalories: 2200, macroSplit: { protein: 35, carbs: 40, fat: 25 },
      specialFocus: ['High Protein', 'Immune Support', 'Digestive Health'],
      cancerType: 'Recovery', createdBy: 'Dr. Michael Chen',
    },
    {
      id: '3', name: 'Ketogenic Cancer Protocol',
      description: 'Low-carb, high-fat approach to potentially starve cancer cells',
      dailyCalories: 1800, macroSplit: { protein: 25, carbs: 5, fat: 70 },
      specialFocus: ['Ketosis', 'Low Sugar', 'Metabolic Therapy'],
      cancerType: 'Active Treatment', createdBy: 'Dr. Emily Wright',
    },
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

  const handleAddWater = useCallback((amount: number) => {
    setWaterIntake((prev) => ({
      ...prev,
      current: prev.current + amount,
      entries: [...prev.entries, { time: new Date().toLocaleTimeString(), amount }],
    }));
  }, []);

  const handleSelectFood = useCallback((food: FoodItem) => {
    Alert.alert(
      'Add Food',
      `Add ${food.name} to your meal log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => setShowFoodSearch(false) },
      ]
    );
  }, []);

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const avgCancerScore = Math.round(meals.reduce((sum, m) => sum + m.cancerFightingScore, 0) / meals.length);

  const renderTodayTab = () => (
    <>
      {/* Daily Summary Card */}
      <View style={styles.dailySummaryCard}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailySummaryGradient}
        >
          <View style={styles.dailySummaryContent}>
            <View style={styles.calorieRingSection}>
              <ProgressRing
                progress={totalCalories / 2000}
                size={120}
                strokeWidth={8}
                color="#fff"
                backgroundColor="rgba(255,255,255,0.3)"
              >
                <View style={styles.calorieRingContent}>
                  <Text style={styles.calorieRingValue}>{totalCalories}</Text>
                  <Text style={styles.calorieRingLabel}>/ 2000 kcal</Text>
                </View>
              </ProgressRing>
            </View>
            <View style={styles.dailySummaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{meals.length}</Text>
                <Text style={styles.summaryStatLabel}>Meals</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{avgCancerScore}</Text>
                <Text style={styles.summaryStatLabel}>Health Score</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{waterIntake.current}ml</Text>
                <Text style={styles.summaryStatLabel}>Water</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Nutrients */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Nutrient Tracking</Text>
        {nutrients.map((nutrient, idx) => (
          <NutrientBar key={idx} nutrient={nutrient} />
        ))}
      </View>

      {/* Meals */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity
            style={styles.addMealButton}
            onPress={() => setShowFoodSearch(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addMealButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {meals.map((meal, idx) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onPress={() => {}}
            index={idx}
          />
        ))}
      </View>

      {/* Water Tracker */}
      <WaterTracker waterIntake={waterIntake} onAddWater={handleAddWater} />
    </>
  );

  const renderPlanTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Nutrition Plans</Text>
      {nutritionPlans.map((plan) => (
        <TouchableOpacity key={plan.id} style={styles.planCard} activeOpacity={0.7}>
          <View style={styles.planCardHeader}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={24} color="#667eea" />
            <View style={styles.planCardTitleSection}>
              <Text style={styles.planCardTitle}>{plan.name}</Text>
              <Text style={styles.planCardCreator}>By {plan.createdBy}</Text>
            </View>
          </View>
          <Text style={styles.planCardDescription}>{plan.description}</Text>
          <View style={styles.planMacroSplit}>
            <View style={[styles.planMacroBar, { flex: plan.macroSplit.protein, backgroundColor: '#E91E63' }]} />
            <View style={[styles.planMacroBar, { flex: plan.macroSplit.carbs, backgroundColor: '#FF9800' }]} />
            <View style={[styles.planMacroBar, { flex: plan.macroSplit.fat, backgroundColor: '#2196F3' }]} />
          </View>
          <View style={styles.planMacroLabels}>
            <Text style={styles.planMacroLabelText}>P: {plan.macroSplit.protein}%</Text>
            <Text style={styles.planMacroLabelText}>C: {plan.macroSplit.carbs}%</Text>
            <Text style={styles.planMacroLabelText}>F: {plan.macroSplit.fat}%</Text>
          </View>
          <View style={styles.planFocusTags}>
            {plan.specialFocus.map((focus, idx) => (
              <View key={idx} style={styles.focusTag}>
                <Text style={styles.focusTagText}>{focus}</Text>
              </View>
            ))}
          </View>
          <View style={styles.planFooter}>
            <Text style={styles.planCalories}>{plan.dailyCalories} kcal/day</Text>
            {plan.cancerType && (
              <View style={styles.cancerTypeBadge}>
                <Text style={styles.cancerTypeBadgeText}>{plan.cancerType}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Nutrition Insights</Text>

      <View style={styles.insightCard}>
        <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.insightGradient}>
          <MaterialCommunityIcons name="star" size={32} color="#fff" />
          <Text style={styles.insightTitle}>Excellent Antioxidant Intake</Text>
          <Text style={styles.insightText}>
            Your diet is rich in antioxidants from blueberries, broccoli, and green tea.
            This helps neutralize free radicals and may reduce cancer risk.
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.insightCard}>
        <LinearGradient colors={['#FF9800', '#FFB74D']} style={styles.insightGradient}>
          <MaterialCommunityIcons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.insightTitle}>Increase Vitamin D</Text>
          <Text style={styles.insightText}>
            Your Vitamin D intake is below the recommended level. Consider adding
            fatty fish, fortified foods, or supplements.
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.insightCard}>
        <LinearGradient colors={['#2196F3', '#42A5F5']} style={styles.insightGradient}>
          <MaterialCommunityIcons name="information" size={32} color="#fff" />
          <Text style={styles.insightTitle}>Anti-Inflammatory Score: 8.5/10</Text>
          <Text style={styles.insightText}>
            Most of your meals contain anti-inflammatory ingredients. Continue including
            turmeric, omega-3 rich foods, and leafy greens.
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.insightCard}>
        <LinearGradient colors={['#9C27B0', '#BA68C8']} style={styles.insightGradient}>
          <MaterialCommunityIcons name="chart-line" size={32} color="#fff" />
          <Text style={styles.insightTitle}>Weekly Trend</Text>
          <Text style={styles.insightText}>
            Your cancer-fighting food score has improved by 12% this week. 
            Keep up the great work with your dietary choices!
          </Text>
        </LinearGradient>
      </View>

      {/* Cancer-Fighting Food Recommendations */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recommended Foods</Text>
      {[
        { name: 'Cruciferous Vegetables', desc: 'Broccoli, cauliflower, kale', icon: 'leaf', color: '#4CAF50' },
        { name: 'Berries', desc: 'Blueberries, strawberries, raspberries', icon: 'fruit-grapes', color: '#9C27B0' },
        { name: 'Omega-3 Rich Fish', desc: 'Salmon, mackerel, sardines', icon: 'fish', color: '#2196F3' },
        { name: 'Spices', desc: 'Turmeric, ginger, garlic', icon: 'food-variant', color: '#FF9800' },
        { name: 'Green Tea', desc: 'Rich in EGCG and catechins', icon: 'tea', color: '#66BB6A' },
        { name: 'Nuts & Seeds', desc: 'Walnuts, flaxseeds, chia', icon: 'peanut', color: '#795548' },
      ].map((food, idx) => (
        <View key={idx} style={styles.recommendedFoodItem}>
          <View style={[styles.recommendedFoodIcon, { backgroundColor: food.color + '20' }]}>
            <MaterialCommunityIcons name={food.icon as any} size={24} color={food.color} />
          </View>
          <View style={styles.recommendedFoodInfo}>
            <Text style={styles.recommendedFoodName}>{food.name}</Text>
            <Text style={styles.recommendedFoodDesc}>{food.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
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
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity onPress={() => setShowFoodSearch(true)}>
          <Ionicons name="add-circle-outline" size={28} color="#667eea" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['today', 'plan', 'insights'] as const).map((tab) => (
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
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#667eea']} />
        }
      >
        {selectedTab === 'today' && renderTodayTab()}
        {selectedTab === 'plan' && renderPlanTab()}
        {selectedTab === 'insights' && renderInsightsTab()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FoodSearchModal
        visible={showFoodSearch}
        onClose={() => setShowFoodSearch(false)}
        onSelectFood={handleSelectFood}
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
  tabBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#E8E8E8', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#667eea', fontWeight: '700' },
  scrollView: { flex: 1 },
  dailySummaryCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  dailySummaryGradient: { padding: 20 },
  dailySummaryContent: { flexDirection: 'row', alignItems: 'center' },
  calorieRingSection: { marginRight: 20 },
  calorieRingContent: { alignItems: 'center' },
  calorieRingValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  calorieRingLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  dailySummaryStats: { flex: 1 },
  summaryStatItem: { marginBottom: 12 },
  summaryStatValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  summaryStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  sectionContainer: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  nutrientBarContainer: { marginBottom: 12 },
  nutrientBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nutrientBarLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nutrientBarLabel: { fontSize: 13, fontWeight: '500', color: '#333' },
  nutrientBarValue: { fontSize: 12, color: '#666' },
  nutrientBarTrack: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden' },
  nutrientBarFill: { height: '100%', borderRadius: 4 },
  addMealButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  addMealButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  mealCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  mealCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mealTypeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mealCardTitleSection: { flex: 1, marginLeft: 12 },
  mealCardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  mealCardTime: { fontSize: 12, color: '#999', marginTop: 2 },
  cancerScoreBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  cancerScoreText: { fontSize: 13, fontWeight: '700' },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12 },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 15, fontWeight: '700', color: '#333' },
  macroLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  macroDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0' },
  ingredientTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientTag: { backgroundColor: '#F0F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  ingredientTagText: { fontSize: 11, color: '#667eea', fontWeight: '500' },
  waterTrackerCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  waterTrackerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  waterTrackerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', flex: 1 },
  waterTrackerProgress: { fontSize: 13, color: '#2196F3', fontWeight: '600' },
  waterGlassContainer: { alignItems: 'center', marginBottom: 16 },
  waterGlass: {
    width: 80, height: 120, borderRadius: 12, borderWidth: 3, borderColor: '#2196F3',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  waterFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(33,150,243,0.3)',
  },
  waterPercentage: { fontSize: 18, fontWeight: '800', color: '#2196F3', zIndex: 1 },
  waterButtonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  waterButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  waterButtonText: { fontSize: 12, fontWeight: '600', color: '#2196F3' },
  planCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  planCardTitleSection: { marginLeft: 12, flex: 1 },
  planCardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  planCardCreator: { fontSize: 12, color: '#999', marginTop: 2 },
  planCardDescription: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  planMacroSplit: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8, gap: 2 },
  planMacroBar: { borderRadius: 4 },
  planMacroLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  planMacroLabelText: { fontSize: 12, color: '#666', fontWeight: '500' },
  planFocusTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  focusTag: { backgroundColor: '#F0F4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  focusTagText: { fontSize: 11, color: '#667eea', fontWeight: '500' },
  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planCalories: { fontSize: 14, fontWeight: '600', color: '#333' },
  cancerTypeBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cancerTypeBadgeText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  insightCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  insightGradient: { padding: 20 },
  insightTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 12, marginBottom: 8 },
  insightText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  recommendedFoodItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  recommendedFoodIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  recommendedFoodInfo: { flex: 1, marginLeft: 12 },
  recommendedFoodName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  recommendedFoodDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  foodSearchModal: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85, paddingBottom: 40,
  },
  foodSearchModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  foodSearchModalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA',
    marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  categoryScroll: { marginVertical: 12 },
  categoryScrollContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  categoryChipActive: { backgroundColor: '#667eea' },
  categoryChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  categoryChipTextActive: { color: '#fff' },
  foodSearchList: { paddingHorizontal: 20, paddingBottom: 20 },
  foodSearchItem: {
    backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  foodSearchItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  foodSearchItemName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  antioxidantBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  antioxidantText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  foodSearchServing: { fontSize: 12, color: '#999', marginBottom: 8 },
  foodSearchMacros: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  foodSearchMacro: { fontSize: 12, color: '#666', fontWeight: '500' },
  cancerFightingProps: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  propTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  propTagText: { fontSize: 10, color: '#4CAF50', fontWeight: '500' },
});

export default NutritionScreen;
