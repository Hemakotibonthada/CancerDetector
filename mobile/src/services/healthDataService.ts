// ============================================================================
// Mobile Health Data Service - Wearable integration, health tracking, vitals
// ============================================================================

import { Platform } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export interface VitalReading {
  id: string;
  type: VitalType;
  value: number;
  unit: string;
  timestamp: string;
  source: 'manual' | 'wearable' | 'device' | 'clinical';
  deviceId?: string;
  status: 'normal' | 'warning' | 'critical';
  notes?: string;
}

export type VitalType = 
  | 'heart_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'temperature'
  | 'oxygen_saturation'
  | 'respiratory_rate'
  | 'blood_glucose'
  | 'weight'
  | 'height'
  | 'bmi'
  | 'steps'
  | 'sleep_hours'
  | 'calories_burned'
  | 'pain_level';

export interface HealthMetric {
  type: VitalType;
  label: string;
  unit: string;
  icon: string;
  color: string;
  normalRange: { min: number; max: number };
  warningRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
}

export interface DailyHealthSummary {
  date: string;
  steps: number;
  stepsGoal: number;
  caloriesBurned: number;
  caloriesGoal: number;
  activeMinutes: number;
  activeMinutesGoal: number;
  sleepHours: number;
  sleepGoal: number;
  waterIntake: number;
  waterGoal: number;
  heartRateAvg: number;
  heartRateMin: number;
  heartRateMax: number;
  oxygenSatAvg: number;
  stressLevel: number;
  healthScore: number;
}

export interface WearableDevice {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_band' | 'blood_pressure_monitor' | 'glucose_monitor' | 'pulse_oximeter' | 'smart_scale';
  brand: string;
  model: string;
  connected: boolean;
  lastSync: string;
  batteryLevel: number;
  firmware: string;
}

export interface SleepData {
  date: string;
  bedtime: string;
  wakeTime: string;
  totalHours: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awakeTime: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  score: number;
}

export interface ExerciseSession {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  caloriesBurned: number;
  avgHeartRate: number;
  maxHeartRate: number;
  distance?: number;
  steps?: number;
  intensity: 'light' | 'moderate' | 'vigorous';
}

export interface NutritionEntry {
  id: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: string;
}

// ============================================================================
// Health Metrics Configuration
// ============================================================================

export const HEALTH_METRICS: Record<string, HealthMetric> = {
  heart_rate: {
    type: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: '❤️', color: '#f44336',
    normalRange: { min: 60, max: 100 },
    warningRange: { min: 50, max: 110 },
    criticalRange: { min: 40, max: 130 },
  },
  blood_pressure_systolic: {
    type: 'blood_pressure_systolic', label: 'BP Systolic', unit: 'mmHg', icon: '🩸', color: '#e91e63',
    normalRange: { min: 90, max: 120 },
    warningRange: { min: 80, max: 140 },
    criticalRange: { min: 70, max: 180 },
  },
  blood_pressure_diastolic: {
    type: 'blood_pressure_diastolic', label: 'BP Diastolic', unit: 'mmHg', icon: '🩸', color: '#e91e63',
    normalRange: { min: 60, max: 80 },
    warningRange: { min: 50, max: 90 },
    criticalRange: { min: 40, max: 120 },
  },
  temperature: {
    type: 'temperature', label: 'Temperature', unit: '°F', icon: '🌡️', color: '#ff9800',
    normalRange: { min: 97.0, max: 99.0 },
    warningRange: { min: 96.0, max: 100.4 },
    criticalRange: { min: 95.0, max: 104.0 },
  },
  oxygen_saturation: {
    type: 'oxygen_saturation', label: 'SpO2', unit: '%', icon: '🫁', color: '#2196f3',
    normalRange: { min: 95, max: 100 },
    warningRange: { min: 90, max: 100 },
    criticalRange: { min: 85, max: 100 },
  },
  blood_glucose: {
    type: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', icon: '🩸', color: '#9c27b0',
    normalRange: { min: 70, max: 100 },
    warningRange: { min: 60, max: 140 },
    criticalRange: { min: 50, max: 250 },
  },
  weight: {
    type: 'weight', label: 'Weight', unit: 'lbs', icon: '⚖️', color: '#607d8b',
    normalRange: { min: 100, max: 250 },
    warningRange: { min: 80, max: 300 },
    criticalRange: { min: 60, max: 400 },
  },
  steps: {
    type: 'steps', label: 'Steps', unit: 'steps', icon: '👟', color: '#4caf50',
    normalRange: { min: 5000, max: 50000 },
    warningRange: { min: 0, max: 50000 },
    criticalRange: { min: 0, max: 100000 },
  },
  sleep_hours: {
    type: 'sleep_hours', label: 'Sleep', unit: 'hrs', icon: '😴', color: '#3f51b5',
    normalRange: { min: 7, max: 9 },
    warningRange: { min: 5, max: 11 },
    criticalRange: { min: 3, max: 14 },
  },
  pain_level: {
    type: 'pain_level', label: 'Pain Level', unit: '/10', icon: '😣', color: '#ff5722',
    normalRange: { min: 0, max: 3 },
    warningRange: { min: 0, max: 6 },
    criticalRange: { min: 0, max: 10 },
  },
};

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateVitalHistory(type: VitalType, days: number = 30): VitalReading[] {
  const metric = HEALTH_METRICS[type];
  if (!metric) return [];

  const readings: VitalReading[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate 1-3 readings per day
    const readingsPerDay = type === 'steps' || type === 'sleep_hours' ? 1 : Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < readingsPerDay; j++) {
      date.setHours(8 + j * 6, Math.floor(Math.random() * 60));
      
      const normalMid = (metric.normalRange.min + metric.normalRange.max) / 2;
      const spread = (metric.normalRange.max - metric.normalRange.min) / 2;
      const value = normalMid + (Math.random() - 0.5) * spread * 2.5;
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (value < metric.criticalRange.min || value > metric.criticalRange.max) status = 'critical';
      else if (value < metric.warningRange.min || value > metric.warningRange.max) status = 'warning';
      else if (value < metric.normalRange.min || value > metric.normalRange.max) status = 'warning';

      readings.push({
        id: `vital-${type}-${i}-${j}`,
        type,
        value: Math.round(value * 10) / 10,
        unit: metric.unit,
        timestamp: date.toISOString(),
        source: Math.random() > 0.5 ? 'wearable' : 'manual',
        status,
      });
    }
  }

  return readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateDailySummary(date: Date): DailyHealthSummary {
  return {
    date: date.toISOString().split('T')[0],
    steps: Math.floor(Math.random() * 8000) + 4000,
    stepsGoal: 10000,
    caloriesBurned: Math.floor(Math.random() * 500) + 1500,
    caloriesGoal: 2000,
    activeMinutes: Math.floor(Math.random() * 40) + 20,
    activeMinutesGoal: 30,
    sleepHours: 6 + Math.random() * 3,
    sleepGoal: 8,
    waterIntake: Math.floor(Math.random() * 4) + 4,
    waterGoal: 8,
    heartRateAvg: Math.floor(Math.random() * 15) + 68,
    heartRateMin: Math.floor(Math.random() * 10) + 55,
    heartRateMax: Math.floor(Math.random() * 30) + 90,
    oxygenSatAvg: 96 + Math.random() * 3,
    stressLevel: Math.floor(Math.random() * 100),
    healthScore: Math.floor(Math.random() * 20) + 75,
  };
}

// ============================================================================
// Health Data Service
// ============================================================================

class HealthDataService {
  private connectedDevices: WearableDevice[] = [];
  private vitalReadings: Map<VitalType, VitalReading[]> = new Map();
  private exerciseSessions: ExerciseSession[] = [];
  private nutritionLog: NutritionEntry[] = [];
  private sleepHistory: SleepData[] = [];

  // ---- Vital Signs ----

  getVitalHistory(type: VitalType, days: number = 30): VitalReading[] {
    if (!this.vitalReadings.has(type)) {
      this.vitalReadings.set(type, generateVitalHistory(type, days));
    }
    return this.vitalReadings.get(type) || [];
  }

  getLatestVital(type: VitalType): VitalReading | null {
    const history = this.getVitalHistory(type);
    return history.length > 0 ? history[0] : null;
  }

  getAllLatestVitals(): Record<VitalType, VitalReading | null> {
    const types: VitalType[] = ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic',
      'temperature', 'oxygen_saturation', 'blood_glucose', 'weight', 'steps', 'sleep_hours', 'pain_level'];
    const result: Record<string, VitalReading | null> = {};
    for (const type of types) {
      result[type] = this.getLatestVital(type);
    }
    return result as Record<VitalType, VitalReading | null>;
  }

  recordVital(type: VitalType, value: number, source: VitalReading['source'] = 'manual', notes?: string): VitalReading {
    const metric = HEALTH_METRICS[type];
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (metric) {
      if (value < metric.criticalRange.min || value > metric.criticalRange.max) status = 'critical';
      else if (value < metric.normalRange.min || value > metric.normalRange.max) status = 'warning';
    }

    const reading: VitalReading = {
      id: `vital-${Date.now()}`,
      type,
      value,
      unit: metric?.unit || '',
      timestamp: new Date().toISOString(),
      source,
      status,
      notes,
    };

    const existing = this.vitalReadings.get(type) || [];
    this.vitalReadings.set(type, [reading, ...existing]);
    return reading;
  }

  getVitalStatus(type: VitalType, value: number): 'normal' | 'warning' | 'critical' {
    const metric = HEALTH_METRICS[type];
    if (!metric) return 'normal';
    if (value < metric.criticalRange.min || value > metric.criticalRange.max) return 'critical';
    if (value < metric.normalRange.min || value > metric.normalRange.max) return 'warning';
    return 'normal';
  }

  getVitalTrend(type: VitalType, days: number = 7): 'improving' | 'declining' | 'stable' {
    const history = this.getVitalHistory(type, days);
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(0, Math.ceil(history.length / 2));
    const older = history.slice(Math.ceil(history.length / 2));
    
    const recentAvg = recent.reduce((s, r) => s + r.value, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + r.value, 0) / older.length;
    
    const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
    if (Math.abs(diff) < 3) return 'stable';
    
    // For most vitals, lower trends toward normal are "improving"
    const metric = HEALTH_METRICS[type];
    if (!metric) return 'stable';
    const normalMid = (metric.normalRange.min + metric.normalRange.max) / 2;
    
    return Math.abs(recentAvg - normalMid) < Math.abs(olderAvg - normalMid) ? 'improving' : 'declining';
  }

  // ---- Daily Summary ----

  getDailySummary(date?: Date): DailyHealthSummary {
    return generateDailySummary(date || new Date());
  }

  getWeeklySummary(): DailyHealthSummary[] {
    const summaries: DailyHealthSummary[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      summaries.push(this.getDailySummary(date));
    }
    return summaries;
  }

  // ---- Wearable Devices ----

  getConnectedDevices(): WearableDevice[] {
    if (this.connectedDevices.length === 0) {
      this.connectedDevices = [
        {
          id: 'dev-1', name: 'Apple Watch Series 9', type: 'smartwatch',
          brand: 'Apple', model: 'Series 9', connected: true,
          lastSync: new Date(Date.now() - 300000).toISOString(),
          batteryLevel: 72, firmware: '10.2.1',
        },
        {
          id: 'dev-2', name: 'Omron Blood Pressure Monitor', type: 'blood_pressure_monitor',
          brand: 'Omron', model: 'Evolv', connected: true,
          lastSync: new Date(Date.now() - 7200000).toISOString(),
          batteryLevel: 85, firmware: '2.1.0',
        },
        {
          id: 'dev-3', name: 'Withings Scale', type: 'smart_scale',
          brand: 'Withings', model: 'Body+', connected: false,
          lastSync: new Date(Date.now() - 86400000).toISOString(),
          batteryLevel: 45, firmware: '1.5.2',
        },
      ];
    }
    return this.connectedDevices;
  }

  async syncDevice(deviceId: string): Promise<boolean> {
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    const device = this.connectedDevices.find(d => d.id === deviceId);
    if (device) {
      device.lastSync = new Date().toISOString();
      return true;
    }
    return false;
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.find(d => d.id === deviceId);
    if (device) {
      device.connected = true;
      return true;
    }
    return false;
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.find(d => d.id === deviceId);
    if (device) {
      device.connected = false;
      return true;
    }
    return false;
  }

  // ---- Sleep Tracking ----

  getSleepHistory(days: number = 14): SleepData[] {
    if (this.sleepHistory.length === 0) {
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const totalHours = 5.5 + Math.random() * 3.5;
        const deep = totalHours * (0.15 + Math.random() * 0.1);
        const rem = totalHours * (0.2 + Math.random() * 0.1);
        const awake = totalHours * (0.05 + Math.random() * 0.05);
        const light = totalHours - deep - rem - awake;
        const score = Math.round(50 + totalHours * 5 + deep * 3 - awake * 10);

        this.sleepHistory.push({
          date: date.toISOString().split('T')[0],
          bedtime: `${22 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          wakeTime: `${6 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          totalHours: Math.round(totalHours * 10) / 10,
          deepSleep: Math.round(deep * 10) / 10,
          lightSleep: Math.round(light * 10) / 10,
          remSleep: Math.round(rem * 10) / 10,
          awakeTime: Math.round(awake * 10) / 10,
          quality: score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor',
          score: Math.min(100, Math.max(0, score)),
        });
      }
    }
    return this.sleepHistory;
  }

  // ---- Exercise Tracking ----

  getExerciseHistory(days: number = 14): ExerciseSession[] {
    if (this.exerciseSessions.length === 0) {
      const types = ['Walking', 'Running', 'Cycling', 'Swimming', 'Yoga', 'Strength Training', 'Pilates'];
      for (let i = 0; i < days; i++) {
        if (Math.random() > 0.3) { // ~70% of days have exercise
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(7 + Math.floor(Math.random() * 10));
          const type = types[Math.floor(Math.random() * types.length)];
          const duration = 20 + Math.floor(Math.random() * 40);
          const avgHR = 100 + Math.floor(Math.random() * 50);
          
          this.exerciseSessions.push({
            id: `ex-${i}`,
            type,
            startTime: date.toISOString(),
            endTime: new Date(date.getTime() + duration * 60000).toISOString(),
            duration,
            caloriesBurned: Math.floor(duration * (avgHR / 20)),
            avgHeartRate: avgHR,
            maxHeartRate: avgHR + 20 + Math.floor(Math.random() * 20),
            distance: ['Walking', 'Running', 'Cycling'].includes(type) ? Math.round(duration * 0.08 * 10) / 10 : undefined,
            steps: ['Walking', 'Running'].includes(type) ? Math.floor(duration * 120) : undefined,
            intensity: avgHR > 140 ? 'vigorous' : avgHR > 120 ? 'moderate' : 'light',
          });
        }
      }
    }
    return this.exerciseSessions;
  }

  recordExercise(session: Omit<ExerciseSession, 'id'>): ExerciseSession {
    const newSession: ExerciseSession = { ...session, id: `ex-${Date.now()}` };
    this.exerciseSessions.unshift(newSession);
    return newSession;
  }

  // ---- Nutrition Tracking ----

  getNutritionLog(date?: string): NutritionEntry[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.nutritionLog.filter(n => n.timestamp.startsWith(targetDate));
  }

  logMeal(entry: Omit<NutritionEntry, 'id' | 'timestamp'>): NutritionEntry {
    const newEntry: NutritionEntry = {
      ...entry,
      id: `nutr-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.nutritionLog.push(newEntry);
    return newEntry;
  }

  getDailyNutritionSummary(date?: string): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    mealCount: number;
  } {
    const entries = this.getNutritionLog(date);
    return {
      totalCalories: entries.reduce((s, e) => s + e.calories, 0),
      totalProtein: entries.reduce((s, e) => s + e.protein, 0),
      totalCarbs: entries.reduce((s, e) => s + e.carbs, 0),
      totalFat: entries.reduce((s, e) => s + e.fat, 0),
      totalFiber: entries.reduce((s, e) => s + e.fiber, 0),
      mealCount: entries.length,
    };
  }

  // ---- Health Score Calculation ----

  calculateHealthScore(): { score: number; breakdown: Record<string, number>; suggestions: string[] } {
    const summary = this.getDailySummary();
    const breakdown: Record<string, number> = {};
    const suggestions: string[] = [];

    // Activity score (0-25)
    breakdown.activity = Math.min(25, Math.round((summary.steps / summary.stepsGoal) * 25));
    if (summary.steps < summary.stepsGoal * 0.5) suggestions.push('Try to reach at least 5,000 steps today');

    // Sleep score (0-25)
    const sleepRatio = summary.sleepHours / summary.sleepGoal;
    breakdown.sleep = Math.min(25, Math.round(sleepRatio >= 0.875 && sleepRatio <= 1.125 ? 25 : sleepRatio * 20));
    if (summary.sleepHours < 6) suggestions.push('Aim for 7-9 hours of sleep tonight');

    // Heart health (0-25)
    const hrScore = summary.heartRateAvg >= 60 && summary.heartRateAvg <= 80 ? 25 :
      summary.heartRateAvg >= 50 && summary.heartRateAvg <= 100 ? 20 : 10;
    breakdown.heartHealth = hrScore;
    if (summary.heartRateAvg > 100) suggestions.push('Consider relaxation exercises to lower resting heart rate');

    // Nutrition & Hydration (0-25)
    breakdown.nutrition = Math.min(25, Math.round((summary.waterIntake / summary.waterGoal) * 15 + 10));
    if (summary.waterIntake < summary.waterGoal) suggestions.push(`Drink ${summary.waterGoal - summary.waterIntake} more glasses of water`);

    const totalScore = Object.values(breakdown).reduce((s, v) => s + v, 0);

    return { score: totalScore, breakdown, suggestions };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const healthDataService = new HealthDataService();
export default healthDataService;
