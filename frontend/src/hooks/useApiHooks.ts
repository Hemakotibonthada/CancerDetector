// ============================================================================
// API Service Hooks - Custom React hooks for API integration
// ============================================================================
// Provides type-safe, reusable hooks for all API endpoints with
// caching, error handling, pagination, and real-time updates.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface UseApiOptions {
  immediate?: boolean;
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  refetch: () => void;
}

interface UsePaginatedReturn<T> extends UseApiReturn<T[]> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================================================
// Cache Manager
// ============================================================================

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = 60000): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) this.cache.delete(key);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

const apiCache = new ApiCache();

// ============================================================================
// Base API Hook
// ============================================================================

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    cache = false,
    cacheTTL = 60000,
    retries = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const argsRef = useRef<any[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    argsRef.current = args;
    const cacheKey = cache ? `${apiFunction.name}:${JSON.stringify(args)}` : '';

    // Check cache
    if (cache && cacheKey) {
      const cached = apiCache.get<T>(cacheKey);
      if (cached !== null) {
        if (mountedRef.current) {
          setData(cached);
          setError(null);
        }
        return cached;
      }
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiFunction(...args);
        if (mountedRef.current) {
          setData(response.data);
          setLoading(false);
          if (cache && cacheKey) {
            apiCache.set(cacheKey, response.data, cacheTTL);
          }
          onSuccess?.(response.data);
        }
        return response.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    if (mountedRef.current && lastError) {
      setError(lastError);
      setLoading(false);
      onError?.(lastError);
    }
    return null;
  }, [apiFunction, cache, cacheTTL, retries, retryDelay, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const refetch = useCallback(() => {
    execute(...argsRef.current);
  }, [execute]);

  useEffect(() => {
    if (immediate) execute();
  }, [immediate, execute]);

  return { data, loading, error, execute, reset, refetch };
}

// ============================================================================
// Paginated API Hook
// ============================================================================

export function usePaginatedApi<T>(
  apiFunction: (params: { page: number; pageSize: number; [key: string]: any }) => Promise<ApiResponse<T[]> & { pagination: PaginationInfo }>,
  initialParams: Record<string, any> = {},
  options: UseApiOptions = {}
): UsePaginatedReturn<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (): Promise<T[] | null> => {
    if (mountedRef.current) setLoading(true);
    try {
      const response = await apiFunction({ page, pageSize, ...initialParams });
      if (mountedRef.current) {
        setItems(response.data);
        if (response.pagination) {
          setTotalItems(response.pagination.totalItems);
          setTotalPages(response.pagination.totalPages);
        }
        setLoading(false);
        options.onSuccess?.(response.data);
      }
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (mountedRef.current) {
        setError(error);
        setLoading(false);
        options.onError?.(error);
      }
      return null;
    }
  }, [apiFunction, page, pageSize, initialParams, options]);

  useEffect(() => {
    execute();
  }, [page, pageSize]);

  const reset = useCallback(() => {
    setItems([]);
    setError(null);
    setPage(1);
    setTotalItems(0);
    setTotalPages(0);
  }, []);

  const refetch = useCallback(() => execute(), [execute]);

  return {
    data: items,
    loading,
    error,
    execute,
    reset,
    refetch,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setPage(p => Math.max(p - 1, 1)),
  };
}

// ============================================================================
// Mutation Hook (POST/PUT/DELETE)
// ============================================================================

interface UseMutationReturn<T, V> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (variables: V) => Promise<T | null>;
  reset: () => void;
}

export function useMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<ApiResponse<T>>,
  options: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    invalidateCache?: string[];
  } = {}
): UseMutationReturn<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: V): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await mutationFn(variables);
      setData(response.data);
      setLoading(false);
      if (options.invalidateCache) {
        options.invalidateCache.forEach(pattern => apiCache.invalidate(pattern));
      }
      options.onSuccess?.(response.data, variables);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
      options.onError?.(error, variables);
      return null;
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}

// ============================================================================
// Infinite Scroll Hook
// ============================================================================

export function useInfiniteScroll<T>(
  apiFunction: (params: { page: number; pageSize: number }) => Promise<ApiResponse<T[]> & { pagination: PaginationInfo }>,
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await apiFunction({ page, pageSize });
      setItems(prev => [...prev, ...response.data]);
      setHasMore(page < (response.pagination?.totalPages || 1));
      setPage(p => p + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [apiFunction, page, pageSize, loading, hasMore]);

  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [hasMore, loading, loadMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  return { items, loading, hasMore, error, loadMore, sentinelRef, reset };
}

// ============================================================================
// Polling Hook  
// ============================================================================

export function usePolling<T>(
  apiFunction: () => Promise<T>,
  interval: number = 30000,
  options: { enabled?: boolean; onUpdate?: (data: T) => void } = {}
) {
  const { enabled = true, onUpdate } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    try {
      const result = await apiFunction();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        onUpdate?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiFunction, onUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      fetchData();
      intervalRef.current = setInterval(fetchData, interval);
    }
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, interval, fetchData]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const restart = useCallback(() => {
    stop();
    fetchData();
    intervalRef.current = setInterval(fetchData, interval);
  }, [stop, fetchData, interval]);

  return { data, loading, error, stop, restart };
}

// ============================================================================
// File Upload Hook
// ============================================================================

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function useFileUpload<T = any>(
  uploadEndpoint: string,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    onProgress?: (progress: UploadProgress) => void;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { maxSize = 50 * 1024 * 1024, allowedTypes, onProgress, onSuccess, onError } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File, metadata?: Record<string, any>): Promise<T | null> => {
    // Validate file
    if (file.size > maxSize) {
      const err = new Error(`File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`);
      setError(err);
      onError?.(err);
      return null;
    }
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      const err = new Error(`File type ${file.type} is not allowed`);
      setError(err);
      onError?.(err);
      return null;
    }

    setUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    abortControllerRef.current = new AbortController();

    try {
      const xhr = new XMLHttpRequest();
      const promise = new Promise<T>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const prog = { loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100) };
            setProgress(prog);
            onProgress?.(prog);
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
        xhr.open('POST', uploadEndpoint);
        const token = localStorage.getItem('access_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const data = await promise;
      setResult(data);
      setUploading(false);
      onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setUploading(false);
      onError?.(error);
      return null;
    }
  }, [uploadEndpoint, maxSize, allowedTypes, onProgress, onSuccess, onError]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setUploading(false);
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
    setResult(null);
  }, []);

  return { upload, cancel, reset, uploading, progress, error, result };
}

// ============================================================================
// Search Hook with Debounce
// ============================================================================

export function useSearch<T>(
  searchFn: (query: string, filters?: Record<string, any>) => Promise<ApiResponse<T[]>>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      setLoading(true);
      try {
        const response = await searchFn(query, filters);
        if (mountedRef.current) {
          setResults(response.data);
          setTotalResults(response.pagination?.totalItems || response.data.length);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, filters, searchFn, debounceMs]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalResults(0);
  }, []);

  return {
    query, setQuery,
    filters, setFilters,
    results, loading, error, totalResults,
    clearSearch,
  };
}

// ============================================================================
// Real-time Data Hook (Optimistic Updates)
// ============================================================================

export function useOptimisticUpdate<T extends { id: string }>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems);
  const rollbackRef = useRef<T[]>([]);

  const addOptimistic = useCallback((item: T, apiFn: () => Promise<any>) => {
    rollbackRef.current = [...items];
    setItems(prev => [item, ...prev]);
    apiFn().catch(() => {
      setItems(rollbackRef.current);
    });
  }, [items]);

  const updateOptimistic = useCallback((id: string, updates: Partial<T>, apiFn: () => Promise<any>) => {
    rollbackRef.current = [...items];
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    apiFn().catch(() => {
      setItems(rollbackRef.current);
    });
  }, [items]);

  const deleteOptimistic = useCallback((id: string, apiFn: () => Promise<any>) => {
    rollbackRef.current = [...items];
    setItems(prev => prev.filter(item => item.id !== id));
    apiFn().catch(() => {
      setItems(rollbackRef.current);
    });
  }, [items]);

  return { items, setItems, addOptimistic, updateOptimistic, deleteOptimistic };
}

// ============================================================================
// Form Submission Hook
// ============================================================================

interface UseFormSubmitOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onValidationError?: (errors: Record<string, string>) => void;
  validate?: (values: V) => Record<string, string> | null;
  resetOnSuccess?: boolean;
}

export function useFormSubmit<T = any, V = any>(
  submitFn: (values: V) => Promise<ApiResponse<T>>,
  options: UseFormSubmitOptions<T, V> = {}
) {
  const { onSuccess, onError, onValidationError, validate, resetOnSuccess = false } = options;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const submit = useCallback(async (values: V): Promise<T | null> => {
    // Validate
    if (validate) {
      const errors = validate(values);
      if (errors && Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        onValidationError?.(errors);
        return null;
      }
    }

    setSubmitting(true);
    setError(null);
    setValidationErrors({});
    setSuccess(false);

    try {
      const response = await submitFn(values);
      setData(response.data);
      setSuccess(true);
      setSubmitting(false);
      onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setSubmitting(false);
      onError?.(error);
      return null;
    }
  }, [submitFn, validate, onSuccess, onError, onValidationError]);

  const reset = useCallback(() => {
    setSubmitting(false);
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setData(null);
  }, []);

  return { submit, submitting, error, validationErrors, success, data, reset };
}

// ============================================================================
// Notification Preferences Hook
// ============================================================================

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  appointmentReminders: boolean;
  labResults: boolean;
  medicationReminders: boolean;
  screeningDue: boolean;
  criticalAlerts: boolean;
  marketingEmails: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email: true, push: true, sms: false, inApp: true,
  appointmentReminders: true, labResults: true,
  medicationReminders: true, screeningDue: true,
  criticalAlerts: true, marketingEmails: false,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem('notification_preferences');
      return stored ? JSON.parse(stored) : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  });

  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K, value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('notification_preferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.setItem('notification_preferences', JSON.stringify(defaultPreferences));
  }, []);

  return { preferences, updatePreference, resetPreferences };
}

// ============================================================================
// Accessibility Hook
// ============================================================================

export function useAccessibility() {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handler);
    return () => motionQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    contrastQuery.addEventListener('change', handler);
    return () => contrastQuery.removeEventListener('change', handler);
  }, []);

  const fontSizeMultiplier = useMemo(() => {
    switch (fontSize) {
      case 'large': return 1.2;
      case 'extra-large': return 1.4;
      default: return 1;
    }
  }, [fontSize]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 1000);
  }, []);

  return {
    fontSize, setFontSize, fontSizeMultiplier,
    highContrast, setHighContrast,
    reducedMotion, setReducedMotion,
    screenReader, setScreenReader,
    announce,
  };
}

// ============================================================================
// Export cache invalidation utility
// ============================================================================

export const invalidateApiCache = (pattern?: string) => apiCache.invalidate(pattern);
export const clearApiCache = () => apiCache.invalidate();
