// ============================================================================
// Analytics Service - Event tracking, performance monitoring, user analytics
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================
interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  page: string;
}

interface PageView {
  path: string;
  title: string;
  referrer: string;
  timestamp: number;
  duration?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

interface UserSession {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  device: string;
  browser: string;
  os: string;
  screenSize: string;
  language: string;
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private pageViews: PageView[] = [];
  private metrics: PerformanceMetric[] = [];
  private session: UserSession;
  private flushInterval: NodeJS.Timeout | null = null;
  private currentPageStart: number = Date.now();
  private enabled: boolean = true;
  private debug: boolean = false;
  private batchSize: number = 50;
  private flushIntervalMs: number = 30000;
  private apiEndpoint: string;

  constructor() {
    this.apiEndpoint = '/api/analytics';
    this.session = this.initSession();
    this.startAutoFlush();
    this.trackPerformance();
    this.setupPageVisibility();
  }

  private initSession(): UserSession {
    const sessionId = sessionStorage.getItem('analytics_session_id') || this.generateId();
    sessionStorage.setItem('analytics_session_id', sessionId);

    return {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
      device: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS(),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    };
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }
  setDebug(debug: boolean): void { this.debug = debug; }

  setUserId(userId: string): void {
    this.session = { ...this.session };
    if (this.debug) console.log('[Analytics] User ID set:', userId);
  }

  // Track custom event
  track(name: string, category: string = 'general', properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      properties,
      timestamp: Date.now(),
      sessionId: this.session.id,
      page: window.location.pathname,
    };

    this.events.push(event);
    this.session.events++;
    this.session.lastActivity = Date.now();

    if (this.debug) console.log('[Analytics] Event:', name, properties);
    if (this.events.length >= this.batchSize) this.flush();
  }

  // Track page view
  trackPageView(path?: string, title?: string): void {
    if (!this.enabled) return;

    // Record duration of previous page
    if (this.pageViews.length > 0) {
      const lastPage = this.pageViews[this.pageViews.length - 1];
      lastPage.duration = Date.now() - this.currentPageStart;
    }

    const pageView: PageView = {
      path: path || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
    };

    this.pageViews.push(pageView);
    this.session.pageViews++;
    this.currentPageStart = Date.now();

    if (this.debug) console.log('[Analytics] Page view:', pageView.path);
  }

  // Track user interactions
  trackClick(element: string, properties?: Record<string, any>): void {
    this.track('click', 'interaction', { element, ...properties });
  }

  trackSearch(query: string, results: number): void {
    this.track('search', 'interaction', { query, results });
  }

  trackFormSubmit(formName: string, success: boolean, errors?: string[]): void {
    this.track('form_submit', 'interaction', { formName, success, errors });
  }

  trackError(error: string, context?: Record<string, any>): void {
    this.track('error', 'error', { error, stack: context?.stack, ...context });
  }

  // Healthcare-specific tracking
  trackAppointmentBooked(doctorId: string, type: string): void {
    this.track('appointment_booked', 'healthcare', { doctorId, type });
  }

  trackMedicationTaken(medicationId: string): void {
    this.track('medication_taken', 'healthcare', { medicationId });
  }

  trackLabResultViewed(resultId: string): void {
    this.track('lab_result_viewed', 'healthcare', { resultId });
  }

  trackDiagnosisViewed(diagnosisId: string, cancerType?: string): void {
    this.track('diagnosis_viewed', 'healthcare', { diagnosisId, cancerType });
  }

  trackScreeningCompleted(screeningType: string): void {
    this.track('screening_completed', 'healthcare', { screeningType });
  }

  trackTelemedicineSession(sessionId: string, duration: number): void {
    this.track('telemedicine_session', 'healthcare', { sessionId, duration });
  }

  trackRiskAssessment(cancerType: string, riskLevel: string): void {
    this.track('risk_assessment', 'healthcare', { cancerType, riskLevel });
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string = 'used'): void {
    this.track('feature_usage', 'feature', { feature, action });
  }

  trackAIInteraction(model: string, action: string, confidence?: number): void {
    this.track('ai_interaction', 'ai', { model, action, confidence });
  }

  // Performance tracking
  trackPerformanceMetric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void {
    if (!this.enabled) return;

    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    });
  }

  // Track API call performance
  trackApiCall(endpoint: string, method: string, duration: number, status: number): void {
    this.trackPerformanceMetric('api_call', duration, 'ms', {
      endpoint,
      method,
      status: String(status),
    });
  }

  // Timing helper
  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.trackPerformanceMetric(name, duration);
    };
  }

  // Get session info
  getSessionInfo(): UserSession {
    return { ...this.session };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async flush(): Promise<void> {
    if (this.events.length === 0 && this.pageViews.length === 0 && this.metrics.length === 0) return;

    const payload = {
      events: [...this.events],
      pageViews: [...this.pageViews],
      metrics: [...this.metrics],
      session: this.session,
    };

    this.events = [];
    this.pageViews = [];
    this.metrics = [];

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.apiEndpoint, JSON.stringify(payload));
      } else {
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch (err) {
      // Re-add events on failure
      this.events.push(...payload.events);
      if (this.debug) console.error('[Analytics] Flush failed:', err);
    }
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }

  private trackPerformance(): void {
    if (!('PerformanceObserver' in window)) return;

    // Track Long Tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceMetric('long_task', entry.duration);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {}

    // Track FCP, LCP, FID, CLS on load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformanceMetric('page_load', navigation.loadEventEnd - navigation.startTime);
          this.trackPerformanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.startTime);
          this.trackPerformanceMetric('first_byte', navigation.responseStart - navigation.requestStart);
          this.trackPerformanceMetric('dom_interactive', navigation.domInteractive - navigation.startTime);
        }

        const paintEntries = performance.getEntriesByType('paint');
        for (const entry of paintEntries) {
          if (entry.name === 'first-contentful-paint') {
            this.trackPerformanceMetric('fcp', entry.startTime);
          }
        }
      }, 0);
    });
  }

  private setupPageVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.track('page_focus', 'engagement');
      } else {
        this.track('page_blur', 'engagement');
      }
    });
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
    return 'Unknown';
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  destroy(): void {
    this.flush();
    if (this.flushInterval) clearInterval(this.flushInterval);
  }
}

// Singleton
export const analytics = new AnalyticsService();
export default AnalyticsService;
