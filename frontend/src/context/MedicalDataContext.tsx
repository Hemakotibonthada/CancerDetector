// ============================================================================
// Medical Data Context - Central medical data state management
// ============================================================================
// Manages patient medical records, vitals, lab results, appointments, and
// cancer screening data across the application.
// ============================================================================

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface VitalSign {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  date: string;
  orderedBy: string;
  reviewed: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued' | 'on_hold';
  refillsRemaining: number;
  sideEffects?: string[];
}

export interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  dateTime: string;
  duration: number;
  type: 'consultation' | 'follow_up' | 'procedure' | 'imaging' | 'lab' | 'telehealth';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  location: string;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  code: string;
  description: string;
  severity: string;
  diagnosedDate: string;
  diagnosedBy: string;
  status: 'active' | 'resolved' | 'chronic';
  cancerStage?: string;
  cancerType?: string;
}

export interface CancerScreening {
  id: string;
  type: string;
  date: string;
  result: string;
  status: 'normal' | 'abnormal' | 'pending';
  nextDueDate: string;
  provider: string;
}

export interface TreatmentPlan {
  id: string;
  type: string;
  protocol: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'active' | 'completed' | 'suspended';
  cycles?: { completed: number; total: number };
  response?: string;
  sideEffects?: string[];
}

export interface Allergy {
  id: string;
  allergen: string;
  type: 'medication' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
}

export interface InsuranceInfo {
  provider: string;
  planName: string;
  memberId: string;
  groupNumber: string;
  expirationDate: string;
  copay: number;
  deductible: { used: number; total: number };
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  mrn: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  emergencyContacts: EmergencyContact[];
  insurance: InsuranceInfo;
  allergies: Allergy[];
  primaryDoctor: string;
}

// ============================================================================
// State
// ============================================================================

interface MedicalDataState {
  patient: PatientProfile | null;
  vitals: VitalSign[];
  labResults: LabResult[];
  medications: Medication[];
  appointments: Appointment[];
  diagnoses: Diagnosis[];
  screenings: CancerScreening[];
  treatmentPlans: TreatmentPlan[];
  loading: {
    patient: boolean;
    vitals: boolean;
    labs: boolean;
    medications: boolean;
    appointments: boolean;
    diagnoses: boolean;
    screenings: boolean;
    treatments: boolean;
  };
  errors: Record<string, string | null>;
  lastFetched: Record<string, string | null>;
}

const initialState: MedicalDataState = {
  patient: null,
  vitals: [],
  labResults: [],
  medications: [],
  appointments: [],
  diagnoses: [],
  screenings: [],
  treatmentPlans: [],
  loading: {
    patient: false,
    vitals: false,
    labs: false,
    medications: false,
    appointments: false,
    diagnoses: false,
    screenings: false,
    treatments: false,
  },
  errors: {},
  lastFetched: {},
};

// ============================================================================
// Actions
// ============================================================================

type MedicalAction =
  | { type: 'SET_PATIENT'; payload: PatientProfile }
  | { type: 'SET_VITALS'; payload: VitalSign[] }
  | { type: 'ADD_VITAL'; payload: VitalSign }
  | { type: 'SET_LAB_RESULTS'; payload: LabResult[] }
  | { type: 'ADD_LAB_RESULT'; payload: LabResult }
  | { type: 'UPDATE_LAB_RESULT'; payload: { id: string; updates: Partial<LabResult> } }
  | { type: 'SET_MEDICATIONS'; payload: Medication[] }
  | { type: 'ADD_MEDICATION'; payload: Medication }
  | { type: 'UPDATE_MEDICATION'; payload: { id: string; updates: Partial<Medication> } }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: { id: string; updates: Partial<Appointment> } }
  | { type: 'CANCEL_APPOINTMENT'; payload: string }
  | { type: 'SET_DIAGNOSES'; payload: Diagnosis[] }
  | { type: 'ADD_DIAGNOSIS'; payload: Diagnosis }
  | { type: 'SET_SCREENINGS'; payload: CancerScreening[] }
  | { type: 'ADD_SCREENING'; payload: CancerScreening }
  | { type: 'SET_TREATMENT_PLANS'; payload: TreatmentPlan[] }
  | { type: 'UPDATE_TREATMENT_PLAN'; payload: { id: string; updates: Partial<TreatmentPlan> } }
  | { type: 'SET_LOADING'; payload: { key: keyof MedicalDataState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string | null } }
  | { type: 'CLEAR_ALL'; payload?: undefined }
  | { type: 'UPDATE_PATIENT'; payload: Partial<PatientProfile> };

// ============================================================================
// Reducer
// ============================================================================

function medicalReducer(state: MedicalDataState, action: MedicalAction): MedicalDataState {
  switch (action.type) {
    case 'SET_PATIENT':
      return { ...state, patient: action.payload, lastFetched: { ...state.lastFetched, patient: new Date().toISOString() } };

    case 'UPDATE_PATIENT':
      return state.patient ? { ...state, patient: { ...state.patient, ...action.payload } } : state;

    case 'SET_VITALS':
      return { ...state, vitals: action.payload, lastFetched: { ...state.lastFetched, vitals: new Date().toISOString() } };

    case 'ADD_VITAL':
      return { ...state, vitals: [action.payload, ...state.vitals] };

    case 'SET_LAB_RESULTS':
      return { ...state, labResults: action.payload, lastFetched: { ...state.lastFetched, labs: new Date().toISOString() } };

    case 'ADD_LAB_RESULT':
      return { ...state, labResults: [action.payload, ...state.labResults] };

    case 'UPDATE_LAB_RESULT':
      return {
        ...state,
        labResults: state.labResults.map(lr =>
          lr.id === action.payload.id ? { ...lr, ...action.payload.updates } : lr
        ),
      };

    case 'SET_MEDICATIONS':
      return { ...state, medications: action.payload, lastFetched: { ...state.lastFetched, medications: new Date().toISOString() } };

    case 'ADD_MEDICATION':
      return { ...state, medications: [action.payload, ...state.medications] };

    case 'UPDATE_MEDICATION':
      return {
        ...state,
        medications: state.medications.map(med =>
          med.id === action.payload.id ? { ...med, ...action.payload.updates } : med
        ),
      };

    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload, lastFetched: { ...state.lastFetched, appointments: new Date().toISOString() } };

    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };

    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload.id ? { ...apt, ...action.payload.updates } : apt
        ),
      };

    case 'CANCEL_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload ? { ...apt, status: 'cancelled' as const } : apt
        ),
      };

    case 'SET_DIAGNOSES':
      return { ...state, diagnoses: action.payload, lastFetched: { ...state.lastFetched, diagnoses: new Date().toISOString() } };

    case 'ADD_DIAGNOSIS':
      return { ...state, diagnoses: [action.payload, ...state.diagnoses] };

    case 'SET_SCREENINGS':
      return { ...state, screenings: action.payload, lastFetched: { ...state.lastFetched, screenings: new Date().toISOString() } };

    case 'ADD_SCREENING':
      return { ...state, screenings: [action.payload, ...state.screenings] };

    case 'SET_TREATMENT_PLANS':
      return { ...state, treatmentPlans: action.payload, lastFetched: { ...state.lastFetched, treatments: new Date().toISOString() } };

    case 'UPDATE_TREATMENT_PLAN':
      return {
        ...state,
        treatmentPlans: state.treatmentPlans.map(plan =>
          plan.id === action.payload.id ? { ...plan, ...action.payload.updates } : plan
        ),
      };

    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value } };

    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.payload.key]: action.payload.error } };

    case 'CLEAR_ALL':
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

interface MedicalDataContextType extends MedicalDataState {
  // Patient
  setPatient: (patient: PatientProfile) => void;
  updatePatient: (updates: Partial<PatientProfile>) => void;

  // Vitals
  setVitals: (vitals: VitalSign[]) => void;
  addVital: (vital: VitalSign) => void;
  getLatestVitals: () => Record<string, VitalSign>;
  getVitalTrend: (type: string, days?: number) => VitalSign[];

  // Labs
  setLabResults: (results: LabResult[]) => void;
  addLabResult: (result: LabResult) => void;
  updateLabResult: (id: string, updates: Partial<LabResult>) => void;
  getPendingLabs: () => LabResult[];
  getAbnormalLabs: () => LabResult[];

  // Medications
  setMedications: (meds: Medication[]) => void;
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  getActiveMedications: () => Medication[];

  // Appointments
  setAppointments: (appts: Appointment[]) => void;
  addAppointment: (appt: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  getUpcomingAppointments: () => Appointment[];

  // Diagnoses
  setDiagnoses: (diagnoses: Diagnosis[]) => void;
  addDiagnosis: (diagnosis: Diagnosis) => void;
  getActiveDiagnoses: () => Diagnosis[];
  getCancerDiagnoses: () => Diagnosis[];

  // Screenings
  setScreenings: (screenings: CancerScreening[]) => void;
  addScreening: (screening: CancerScreening) => void;
  getOverdueScreenings: () => CancerScreening[];

  // Treatment Plans
  setTreatmentPlans: (plans: TreatmentPlan[]) => void;
  updateTreatmentPlan: (id: string, updates: Partial<TreatmentPlan>) => void;
  getActiveTreatments: () => TreatmentPlan[];

  // Utility
  clearAll: () => void;
  setLoading: (key: keyof MedicalDataState['loading'], value: boolean) => void;
  setError: (key: string, error: string | null) => void;

  // Computed
  hasAnyAlerts: boolean;
  alertCount: number;
  healthScore: number;
}

const MedicalDataContext = createContext<MedicalDataContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export const MedicalDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(medicalReducer, initialState);

  // ---- Patient ----
  const setPatient = useCallback((patient: PatientProfile) => {
    dispatch({ type: 'SET_PATIENT', payload: patient });
  }, []);

  const updatePatient = useCallback((updates: Partial<PatientProfile>) => {
    dispatch({ type: 'UPDATE_PATIENT', payload: updates });
  }, []);

  // ---- Vitals ----
  const setVitals = useCallback((vitals: VitalSign[]) => {
    dispatch({ type: 'SET_VITALS', payload: vitals });
  }, []);

  const addVital = useCallback((vital: VitalSign) => {
    dispatch({ type: 'ADD_VITAL', payload: vital });
  }, []);

  const getLatestVitals = useCallback((): Record<string, VitalSign> => {
    const latest: Record<string, VitalSign> = {};
    const sorted = [...state.vitals].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    for (const vital of sorted) {
      if (!latest[vital.type]) {
        latest[vital.type] = vital;
      }
    }
    return latest;
  }, [state.vitals]);

  const getVitalTrend = useCallback((type: string, days: number = 30): VitalSign[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return state.vitals
      .filter(v => v.type === type && new Date(v.timestamp) >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [state.vitals]);

  // ---- Labs ----
  const setLabResults = useCallback((results: LabResult[]) => {
    dispatch({ type: 'SET_LAB_RESULTS', payload: results });
  }, []);

  const addLabResult = useCallback((result: LabResult) => {
    dispatch({ type: 'ADD_LAB_RESULT', payload: result });
  }, []);

  const updateLabResult = useCallback((id: string, updates: Partial<LabResult>) => {
    dispatch({ type: 'UPDATE_LAB_RESULT', payload: { id, updates } });
  }, []);

  const getPendingLabs = useCallback((): LabResult[] => {
    return state.labResults.filter(lr => lr.status === 'pending');
  }, [state.labResults]);

  const getAbnormalLabs = useCallback((): LabResult[] => {
    return state.labResults.filter(lr => lr.status === 'abnormal' || lr.status === 'critical');
  }, [state.labResults]);

  // ---- Medications ----
  const setMedications = useCallback((meds: Medication[]) => {
    dispatch({ type: 'SET_MEDICATIONS', payload: meds });
  }, []);

  const addMedication = useCallback((med: Medication) => {
    dispatch({ type: 'ADD_MEDICATION', payload: med });
  }, []);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    dispatch({ type: 'UPDATE_MEDICATION', payload: { id, updates } });
  }, []);

  const getActiveMedications = useCallback((): Medication[] => {
    return state.medications.filter(m => m.status === 'active');
  }, [state.medications]);

  // ---- Appointments ----
  const setAppointments = useCallback((appts: Appointment[]) => {
    dispatch({ type: 'SET_APPOINTMENTS', payload: appts });
  }, []);

  const addAppointment = useCallback((appt: Appointment) => {
    dispatch({ type: 'ADD_APPOINTMENT', payload: appt });
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    dispatch({ type: 'UPDATE_APPOINTMENT', payload: { id, updates } });
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    dispatch({ type: 'CANCEL_APPOINTMENT', payload: id });
  }, []);

  const getUpcomingAppointments = useCallback((): Appointment[] => {
    const now = new Date();
    return state.appointments
      .filter(a => new Date(a.dateTime) > now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [state.appointments]);

  // ---- Diagnoses ----
  const setDiagnoses = useCallback((diagnoses: Diagnosis[]) => {
    dispatch({ type: 'SET_DIAGNOSES', payload: diagnoses });
  }, []);

  const addDiagnosis = useCallback((diagnosis: Diagnosis) => {
    dispatch({ type: 'ADD_DIAGNOSIS', payload: diagnosis });
  }, []);

  const getActiveDiagnoses = useCallback((): Diagnosis[] => {
    return state.diagnoses.filter(d => d.status === 'active' || d.status === 'chronic');
  }, [state.diagnoses]);

  const getCancerDiagnoses = useCallback((): Diagnosis[] => {
    return state.diagnoses.filter(d => d.cancerType || (d.code && d.code.startsWith('C')));
  }, [state.diagnoses]);

  // ---- Screenings ----
  const setScreenings = useCallback((screenings: CancerScreening[]) => {
    dispatch({ type: 'SET_SCREENINGS', payload: screenings });
  }, []);

  const addScreening = useCallback((screening: CancerScreening) => {
    dispatch({ type: 'ADD_SCREENING', payload: screening });
  }, []);

  const getOverdueScreenings = useCallback((): CancerScreening[] => {
    const now = new Date();
    return state.screenings.filter(s => new Date(s.nextDueDate) < now);
  }, [state.screenings]);

  // ---- Treatment Plans ----
  const setTreatmentPlans = useCallback((plans: TreatmentPlan[]) => {
    dispatch({ type: 'SET_TREATMENT_PLANS', payload: plans });
  }, []);

  const updateTreatmentPlan = useCallback((id: string, updates: Partial<TreatmentPlan>) => {
    dispatch({ type: 'UPDATE_TREATMENT_PLAN', payload: { id, updates } });
  }, []);

  const getActiveTreatments = useCallback((): TreatmentPlan[] => {
    return state.treatmentPlans.filter(tp => tp.status === 'active');
  }, [state.treatmentPlans]);

  // ---- Utility ----
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const setLoading = useCallback((key: keyof MedicalDataState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, error } });
  }, []);

  // ---- Computed Values ----
  const abnormalLabs = state.labResults.filter(lr => lr.status === 'abnormal' || lr.status === 'critical');
  const criticalVitals = state.vitals.filter(v => v.status === 'critical');
  const overdueScreenings = state.screenings.filter(s => new Date(s.nextDueDate) < new Date());

  const alertCount = abnormalLabs.length + criticalVitals.length + overdueScreenings.length;
  const hasAnyAlerts = alertCount > 0;

  // Simple health score calculation (0-100)
  const healthScore = (() => {
    let score = 100;
    score -= criticalVitals.length * 15;
    score -= abnormalLabs.length * 5;
    score -= overdueScreenings.length * 8;
    score -= state.diagnoses.filter(d => d.status === 'active' && d.severity === 'severe').length * 10;
    score -= state.medications.filter(m => m.status === 'active').length * 2;
    return Math.max(0, Math.min(100, score));
  })();

  const contextValue: MedicalDataContextType = {
    ...state,
    setPatient, updatePatient,
    setVitals, addVital, getLatestVitals, getVitalTrend,
    setLabResults, addLabResult, updateLabResult, getPendingLabs, getAbnormalLabs,
    setMedications, addMedication, updateMedication, getActiveMedications,
    setAppointments, addAppointment, updateAppointment, cancelAppointment, getUpcomingAppointments,
    setDiagnoses, addDiagnosis, getActiveDiagnoses, getCancerDiagnoses,
    setScreenings, addScreening, getOverdueScreenings,
    setTreatmentPlans, updateTreatmentPlan, getActiveTreatments,
    clearAll, setLoading, setError,
    hasAnyAlerts, alertCount, healthScore,
  };

  return (
    <MedicalDataContext.Provider value={contextValue}>
      {children}
    </MedicalDataContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useMedicalData = (): MedicalDataContextType => {
  const context = useContext(MedicalDataContext);
  if (!context) {
    throw new Error('useMedicalData must be used within a MedicalDataProvider');
  }
  return context;
};

// Specialized hooks for specific data
export const useVitals = () => {
  const { vitals, loading, addVital, getLatestVitals, getVitalTrend } = useMedicalData();
  return { vitals, loading: loading.vitals, addVital, getLatestVitals, getVitalTrend };
};

export const useLabResults = () => {
  const { labResults, loading, addLabResult, updateLabResult, getPendingLabs, getAbnormalLabs } = useMedicalData();
  return { labResults, loading: loading.labs, addLabResult, updateLabResult, getPendingLabs, getAbnormalLabs };
};

export const useMedications = () => {
  const { medications, loading, addMedication, updateMedication, getActiveMedications } = useMedicalData();
  return { medications, loading: loading.medications, addMedication, updateMedication, getActiveMedications };
};

export const useAppointments = () => {
  const { appointments, loading, addAppointment, updateAppointment, cancelAppointment, getUpcomingAppointments } = useMedicalData();
  return { appointments, loading: loading.appointments, addAppointment, updateAppointment, cancelAppointment, getUpcomingAppointments };
};

export const useDiagnoses = () => {
  const { diagnoses, loading, addDiagnosis, getActiveDiagnoses, getCancerDiagnoses } = useMedicalData();
  return { diagnoses, loading: loading.diagnoses, addDiagnosis, getActiveDiagnoses, getCancerDiagnoses };
};

export const useScreenings = () => {
  const { screenings, loading, addScreening, getOverdueScreenings } = useMedicalData();
  return { screenings, loading: loading.screenings, addScreening, getOverdueScreenings };
};

export const useTreatmentPlans = () => {
  const { treatmentPlans, loading, updateTreatmentPlan, getActiveTreatments } = useMedicalData();
  return { treatmentPlans, loading: loading.treatments, updateTreatmentPlan, getActiveTreatments };
};

export const useHealthAlerts = () => {
  const { hasAnyAlerts, alertCount, healthScore } = useMedicalData();
  return { hasAnyAlerts, alertCount, healthScore };
};

export default MedicalDataContext;
