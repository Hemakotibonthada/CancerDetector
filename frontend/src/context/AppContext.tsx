// ============================================================================
// App Context - Global application state management
// ============================================================================
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================
interface SidebarState {
  open: boolean;
  collapsed: boolean;
  activeSection: string;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface GlobalLoading {
  active: boolean;
  message?: string;
  progress?: number;
}

interface FeatureFlags {
  aiDiagnostics: boolean;
  telemedicine: boolean;
  genomicsAnalysis: boolean;
  smartwatchIntegration: boolean;
  clinicalTrials: boolean;
  mentalHealth: boolean;
  pharmacy: boolean;
  billing: boolean;
  bloodDonation: boolean;
  education: boolean;
  research: boolean;
  populationHealth: boolean;
  emergencyServices: boolean;
  rehabilitation: boolean;
  nutrition: boolean;
  pathology: boolean;
  radiology: boolean;
  socialDeterminants: boolean;
  qualitySafety: boolean;
  supplyChain: boolean;
  workforce: boolean;
  patientEngagement: boolean;
  communication: boolean;
  wearables: boolean;
}

interface AppContextType {
  // Sidebar
  sidebar: SidebarState;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  setActiveSection: (section: string) => void;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;

  // Global loading
  globalLoading: GlobalLoading;
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
  setGlobalProgress: (progress: number) => void;

  // Feature flags
  features: FeatureFlags;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  toggleFeature: (feature: keyof FeatureFlags) => void;

  // Page title
  pageTitle: string;
  setPageTitle: (title: string) => void;

  // Online status
  isOnline: boolean;

  // Language
  language: string;
  setLanguage: (lang: string) => void;

  // Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  toggleSearch: () => void;

  // Misc
  lastActivity: Date;
  updateActivity: () => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================
const defaultFeatures: FeatureFlags = {
  aiDiagnostics: true,
  telemedicine: true,
  genomicsAnalysis: true,
  smartwatchIntegration: true,
  clinicalTrials: true,
  mentalHealth: true,
  pharmacy: true,
  billing: true,
  bloodDonation: true,
  education: true,
  research: true,
  populationHealth: true,
  emergencyServices: true,
  rehabilitation: true,
  nutrition: true,
  pathology: true,
  radiology: true,
  socialDeterminants: true,
  qualitySafety: true,
  supplyChain: true,
  workforce: true,
  patientEngagement: true,
  communication: true,
  wearables: true,
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

// ============================================================================
// PROVIDER
// ============================================================================
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Sidebar state
  const [sidebar, setSidebar] = useState<SidebarState>({
    open: true,
    collapsed: false,
    activeSection: 'dashboard',
  });

  // Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Global loading
  const [globalLoading, setGlobalLoading] = useState<GlobalLoading>({ active: false });

  // Feature flags
  const [features, setFeatures] = useState<FeatureFlags>(() => {
    try {
      const saved = localStorage.getItem('feature-flags');
      return saved ? { ...defaultFeatures, ...JSON.parse(saved) } : defaultFeatures;
    } catch { return defaultFeatures; }
  });

  // Page title
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Language
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('app-language') || navigator.language.slice(0, 2) || 'en';
  });

  // Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Activity tracking
  const [lastActivity, setLastActivity] = useState(new Date());

  // Online status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update document title
  useEffect(() => {
    document.title = `${pageTitle} | CancerGuard AI`;
  }, [pageTitle]);

  // Persist features
  useEffect(() => {
    localStorage.setItem('feature-flags', JSON.stringify(features));
  }, [features]);

  // Sidebar handlers
  const toggleSidebar = useCallback(() =>
    setSidebar((prev) => ({ ...prev, open: !prev.open })), []);
  const collapseSidebar = useCallback(() =>
    setSidebar((prev) => ({ ...prev, collapsed: true })), []);
  const expandSidebar = useCallback(() =>
    setSidebar((prev) => ({ ...prev, collapsed: false })), []);
  const setActiveSection = useCallback((section: string) =>
    setSidebar((prev) => ({ ...prev, activeSection: section })), []);

  // Loading handlers
  const showGlobalLoading = useCallback((message?: string) =>
    setGlobalLoading({ active: true, message, progress: undefined }), []);
  const hideGlobalLoading = useCallback(() =>
    setGlobalLoading({ active: false }), []);
  const setGlobalProgress = useCallback((progress: number) =>
    setGlobalLoading((prev) => ({ ...prev, progress })), []);

  // Feature handlers
  const isFeatureEnabled = useCallback((feature: keyof FeatureFlags) =>
    features[feature], [features]);
  const toggleFeature = useCallback((feature: keyof FeatureFlags) =>
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] })), []);

  // Language handler
  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.setAttribute('lang', lang);
  }, []);

  // Search handler
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);

  // Activity handler
  const updateActivity = useCallback(() => setLastActivity(new Date()), []);

  // Track activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => updateActivity();
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, handler));
  }, [updateActivity]);

  const contextValue = useMemo<AppContextType>(() => ({
    sidebar, toggleSidebar, collapseSidebar, expandSidebar, setActiveSection,
    breadcrumbs, setBreadcrumbs,
    globalLoading, showGlobalLoading, hideGlobalLoading, setGlobalProgress,
    features, isFeatureEnabled, toggleFeature,
    pageTitle, setPageTitle,
    isOnline,
    language, setLanguage,
    globalSearchQuery, setGlobalSearchQuery, isSearchOpen, toggleSearch,
    lastActivity, updateActivity,
  }), [
    sidebar, toggleSidebar, collapseSidebar, expandSidebar, setActiveSection,
    breadcrumbs, globalLoading, showGlobalLoading, hideGlobalLoading, setGlobalProgress,
    features, isFeatureEnabled, toggleFeature, pageTitle, isOnline,
    language, setLanguage, globalSearchQuery, isSearchOpen, toggleSearch,
    lastActivity, updateActivity,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
