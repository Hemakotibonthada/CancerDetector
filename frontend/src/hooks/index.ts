// ============================================================================
// Custom React Hooks - Comprehensive Hook Library for CancerGuard AI
// ============================================================================
// 20+ production-ready custom hooks for state management, side effects,
// performance optimization, and UI interactions.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo, useReducer, useLayoutEffect } from 'react';

// ============================================================================
// 1. useDebounce - Debounce values for search/input performance
// ============================================================================

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedCallback;
}

// ============================================================================
// 2. useLocalStorage - Persistent state with localStorage sync
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          setStoredValue(e.newValue as unknown as T);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// ============================================================================
// 3. useSessionStorage - Session-scoped persistent state
// ============================================================================

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================================================
// 4. useIntersectionObserver - Visibility detection for lazy loading
// ============================================================================

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface IntersectionResult {
  ref: (node: Element | null) => void;
  isVisible: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): IntersectionResult {
  const { threshold = 0.1, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);
  const frozen = entry?.isIntersecting && freezeOnceVisible;

  const ref = useCallback((el: Element | null) => setNode(el), []);

  useEffect(() => {
    if (!node || frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold, root, rootMargin, frozen]);

  return { ref, isVisible: !!entry?.isIntersecting, entry };
}

// ============================================================================
// 5. useWebSocket - WebSocket connection management
// ============================================================================

interface WebSocketOptions {
  url: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  protocols?: string | string[];
}

interface WebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: MessageEvent | null;
  sendMessage: (data: string | ArrayBuffer | Blob) => void;
  disconnect: () => void;
  reconnect: () => void;
  connectionState: 'connecting' | 'open' | 'closing' | 'closed';
}

export function useWebSocket(options: WebSocketOptions): WebSocketReturn {
  const {
    url,
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnect: autoReconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    protocols,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'closing' | 'closed'>('closed');
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    try {
      setConnectionState('connecting');
      const ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url);

      ws.onopen = (event) => {
        setIsConnected(true);
        setConnectionState('open');
        reconnectCount.current = 0;
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionState('closed');
        onClose?.(event);
        if (autoReconnect && reconnectCount.current < reconnectAttempts && !event.wasClean) {
          reconnectTimer.current = setTimeout(() => {
            reconnectCount.current += 1;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      setSocket(ws);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionState('closed');
    }
  }, [url, protocols, autoReconnect, reconnectInterval, reconnectAttempts, onOpen, onMessage, onClose, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectCount.current = reconnectAttempts;
    if (socket) {
      setConnectionState('closing');
      socket.close(1000, 'Manual disconnect');
    }
  }, [socket, reconnectAttempts]);

  const sendMessage = useCallback(
    (data: string | ArrayBuffer | Blob) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data);
      } else {
        console.warn('WebSocket is not connected');
      }
    },
    [socket]
  );

  const reconnectFn = useCallback(() => {
    reconnectCount.current = 0;
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (socket) socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { socket, isConnected, lastMessage, sendMessage, disconnect, reconnect: reconnectFn, connectionState };
}

// ============================================================================
// 6. useNotifications - Browser push notification management
// ============================================================================

interface NotificationOptions {
  autoRequest?: boolean;
  onPermissionChange?: (permission: NotificationPermission) => void;
}

interface NotificationReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: globalThis.NotificationOptions) => Notification | null;
  notifications: Notification[];
  clearNotifications: () => void;
}

export function useNotifications(options: NotificationOptions = {}): NotificationReturn {
  const { autoRequest = false, onPermissionChange } = options;
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isSupported = typeof Notification !== 'undefined';

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    onPermissionChange?.(result);
    return result;
  }, [isSupported, onPermissionChange]);

  const showNotification = useCallback(
    (title: string, opts?: globalThis.NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return null;
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...opts,
      });
      setNotifications((prev) => [...prev, notification]);
      notification.onclose = () => {
        setNotifications((prev) => prev.filter((n) => n !== notification));
      };
      return notification;
    },
    [isSupported, permission]
  );

  const clearNotifications = useCallback(() => {
    notifications.forEach((n) => n.close());
    setNotifications([]);
  }, [notifications]);

  useEffect(() => {
    if (autoRequest && isSupported && permission === 'default') {
      requestPermission();
    }
  }, [autoRequest, isSupported, permission, requestPermission]);

  return { permission, isSupported, requestPermission, showNotification, notifications, clearNotifications };
}

// ============================================================================
// 7. usePagination - Pagination state management
// ============================================================================

interface PaginationOptions {
  totalItems: number;
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

interface PaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  pageSizeOptions: number[];
  pageRange: number[];
}

export function usePagination(options: PaginationOptions): PaginationReturn {
  const {
    totalItems,
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100],
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages]
  );

  const setPageSize = useCallback(
    (newSize: number) => {
      setPageSizeState(newSize);
      setPageState(1);
    },
    []
  );

  const nextPage = useCallback(() => setPage(page + 1), [page, setPage]);
  const prevPage = useCallback(() => setPage(page - 1), [page, setPage]);
  const firstPage = useCallback(() => setPage(1), [setPage]);
  const lastPage = useCallback(() => setPage(totalPages), [setPage, totalPages]);

  const pageRange = useMemo(() => {
    const range: number[] = [];
    const maxVisible = 7;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPageState(totalPages);
  }, [page, totalPages]);

  return {
    page, pageSize, totalPages, totalItems, startIndex, endIndex,
    hasNextPage, hasPrevPage, setPage, setPageSize,
    nextPage, prevPage, firstPage, lastPage,
    pageSizeOptions, pageRange,
  };
}

// ============================================================================
// 8. useForm - Form state management with validation
// ============================================================================

type ValidationRule<T> = {
  validate: (value: any, formData: T) => boolean;
  message: string;
};

type FormErrors<T> = Partial<Record<keyof T, string>>;
type FormTouched<T> = Partial<Record<keyof T, boolean>>;
type FormValidationRules<T> = Partial<Record<keyof T, ValidationRule<T>[]>>;

interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validationRules?: FormValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormReturn<T extends Record<string, any>> {
  values: T;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  handleChange: (name: keyof T) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | any) => void;
  handleBlur: (name: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, isTouched?: boolean) => void;
  reset: (newValues?: T) => void;
  validateField: (name: keyof T) => string | null;
  validateForm: () => FormErrors<T>;
  getFieldProps: (name: keyof T) => {
    value: any;
    onChange: (e: any) => void;
    onBlur: () => void;
    error: boolean;
    helperText: string;
    name: string;
  };
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>): UseFormReturn<T> {
  const {
    initialValues,
    validationRules = {} as FormValidationRules<T>,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRef = useRef(initialValues);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialRef.current),
    [values]
  );

  const validateField = useCallback(
    (name: keyof T): string | null => {
      const rules = validationRules[name];
      if (!rules) return null;
      for (const rule of rules) {
        if (!rule.validate(values[name], values)) return rule.message;
      }
      return null;
    },
    [values, validationRules]
  );

  const validateForm = useCallback((): FormErrors<T> => {
    const newErrors: FormErrors<T> = {};
    for (const key of Object.keys(validationRules)) {
      const error = validateField(key as keyof T);
      if (error) (newErrors as any)[key] = error;
    }
    return newErrors;
  }, [validationRules, validateField]);

  const isValid = useMemo(() => {
    const formErrors = validateForm();
    return Object.keys(formErrors).length === 0;
  }, [validateForm]);

  const handleChange = useCallback(
    (name: keyof T) => (event: any) => {
      const value = event?.target !== undefined ? event.target.value : event;
      setValues((prev) => ({ ...prev, [name]: value }));
      if (validateOnChange) {
        const error = validateField(name);
        setErrors((prev) => {
          const next = { ...prev };
          if (error) (next as any)[name] = error;
          else delete (next as any)[name];
          return next;
        });
      }
    },
    [validateOnChange, validateField]
  );

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      if (validateOnBlur) {
        const error = validateField(name);
        setErrors((prev) => {
          const next = { ...prev };
          if (error) (next as any)[name] = error;
          else delete (next as any)[name];
          return next;
        });
      }
    },
    [validateOnBlur, validateField]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const allTouched: FormTouched<T> = {};
      for (const key of Object.keys(values)) (allTouched as any)[key] = true;
      setTouched(allTouched);

      const formErrors = validateForm();
      setErrors(formErrors);

      if (Object.keys(formErrors).length === 0 && onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit]
  );

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialRef.current);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    []
  );

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: values[name] ?? '',
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      error: !!(touched[name] && errors[name]),
      helperText: (touched[name] && errors[name]) || '',
      name: name as string,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  return {
    values, errors, touched, isValid, isDirty, isSubmitting,
    handleChange, handleBlur, handleSubmit,
    setFieldValue, setFieldError, setFieldTouched,
    reset, validateField, validateForm, getFieldProps,
  };
}

// ============================================================================
// 9. useClickOutside - Detect clicks outside element
// ============================================================================

export function useClickOutside<T extends HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, enabled]);

  return ref;
}

// ============================================================================
// 10. useKeyPress - Keyboard shortcut detection
// ============================================================================

interface KeyPressOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  target?: HTMLElement | Window | null;
}

export function useKeyPress(
  keyOrOptions: string | KeyPressOptions,
  callback?: (event: KeyboardEvent) => void
): boolean {
  const [isPressed, setIsPressed] = useState(false);
  const options = typeof keyOrOptions === 'string' ? { key: keyOrOptions } : keyOrOptions;

  useEffect(() => {
    const target = options.target || window;

    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      const matches =
        e.key === options.key &&
        (!options.ctrlKey || e.ctrlKey) &&
        (!options.shiftKey || e.shiftKey) &&
        (!options.altKey || e.altKey) &&
        (!options.metaKey || e.metaKey);

      if (matches) {
        if (options.preventDefault) e.preventDefault();
        setIsPressed(true);
        callback?.(e);
      }
    };

    const handleKeyUp = (event: Event) => {
      const e = event as KeyboardEvent;
      if (e.key === options.key) setIsPressed(false);
    };

    target.addEventListener('keydown', handleKeyDown);
    target.addEventListener('keyup', handleKeyUp);
    return () => {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
    };
  }, [options.key, options.ctrlKey, options.shiftKey, options.altKey, options.metaKey, options.preventDefault, options.target, callback]);

  return isPressed;
}

// ============================================================================
// 11. useClipboard - Clipboard API wrapper
// ============================================================================

interface ClipboardReturn {
  copiedText: string;
  isCopied: boolean;
  copy: (text: string) => Promise<boolean>;
  paste: () => Promise<string>;
  reset: () => void;
}

export function useClipboard(resetAfterMs: number = 2000): ClipboardReturn {
  const [copiedText, setCopiedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopiedText(text);
        setIsCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setIsCopied(false), resetAfterMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetAfterMs]
  );

  const paste = useCallback(async (): Promise<string> => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }, []);

  const reset = useCallback(() => {
    setCopiedText('');
    setIsCopied(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { copiedText, isCopied, copy, paste, reset };
}

// ============================================================================
// 12. useOnlineStatus - Network connectivity detection
// ============================================================================

export function useOnlineStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
} {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(navigator.onLine ? new Date() : null);
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastOnlineAt(new Date());
    };
    const handleOffline = () => {
      setIsOnline(false);
      setLastOfflineAt(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, lastOnlineAt, lastOfflineAt };
}

// ============================================================================
// 13. useCountdown - Timer countdown hook
// ============================================================================

interface CountdownOptions {
  targetDate?: Date;
  durationMs?: number;
  interval?: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

interface CountdownReturn {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isRunning: boolean;
  isCompleted: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formatted: string;
}

export function useCountdown(options: CountdownOptions = {}): CountdownReturn {
  const { targetDate, durationMs, interval = 1000, autoStart = true, onComplete } = options;
  const [totalMs, setTotalMs] = useState(() => {
    if (targetDate) return Math.max(0, targetDate.getTime() - Date.now());
    return durationMs || 0;
  });
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isRunning || totalMs <= 0) return;

    intervalRef.current = setInterval(() => {
      setTotalMs((prev) => {
        const next = targetDate ? Math.max(0, targetDate.getTime() - Date.now()) : prev - interval;
        if (next <= 0) {
          setIsRunning(false);
          setIsCompleted(true);
          onComplete?.();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, interval, targetDate, onComplete, totalMs]);

  const days = Math.floor(totalMs / 86400000);
  const hours = Math.floor((totalMs % 86400000) / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    const resetMs = targetDate ? Math.max(0, targetDate.getTime() - Date.now()) : (durationMs || 0);
    setTotalMs(resetMs);
    setIsCompleted(false);
  }, [targetDate, durationMs]);

  const formatted = `${days > 0 ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { days, hours, minutes, seconds, totalMs, isRunning, isCompleted, start, pause, reset, formatted };
}

// ============================================================================
// 14. useScrollPosition - Track scroll position
// ============================================================================

interface ScrollPosition {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'none';
  isAtTop: boolean;
  isAtBottom: boolean;
  progress: number;
}

export function useScrollPosition(element?: React.RefObject<HTMLElement | null>): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({
    x: 0, y: 0, direction: 'none', isAtTop: true, isAtBottom: false, progress: 0,
  });
  const prevY = useRef(0);

  useEffect(() => {
    const target = element?.current || window;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = element?.current;
        const y = el ? el.scrollTop : window.scrollY;
        const x = el ? el.scrollLeft : window.scrollX;
        const maxScroll = el
          ? el.scrollHeight - el.clientHeight
          : document.documentElement.scrollHeight - window.innerHeight;

        setPosition({
          x, y,
          direction: y > prevY.current ? 'down' : y < prevY.current ? 'up' : 'none',
          isAtTop: y <= 0,
          isAtBottom: y >= maxScroll - 5,
          progress: maxScroll > 0 ? y / maxScroll : 0,
        });
        prevY.current = y;
        ticking = false;
      });
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => target.removeEventListener('scroll', handleScroll);
  }, [element]);

  return position;
}

// ============================================================================
// 15. useWindowSize - Window resize tracking
// ============================================================================

interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => getWindowSize());

  useEffect(() => {
    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setSize(getWindowSize()));
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return size;
}

function getWindowSize(): WindowSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    width, height,
    isMobile: width < 600,
    isTablet: width >= 600 && width < 960,
    isDesktop: width >= 960 && width < 1280,
    isLargeDesktop: width >= 1280,
    breakpoint: width < 600 ? 'xs' : width < 960 ? 'sm' : width < 1280 ? 'md' : width < 1920 ? 'lg' : 'xl',
  };
}

// ============================================================================
// 16. usePrevious - Track previous value
// ============================================================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// ============================================================================
// 17. useToggle - Boolean toggle hook
// ============================================================================

export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

// ============================================================================
// 18. useAsync - Async operation handler
// ============================================================================

type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

interface AsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T) => void;
}

export function useAsync<T>(
  asyncFn?: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): AsyncReturn<T> {
  const [state, dispatch] = useReducer(
    (state: AsyncState<T>, action: any): AsyncState<T> => {
      switch (action.type) {
        case 'PENDING':
          return { ...state, status: 'pending', data: null, error: null, isLoading: true, isSuccess: false, isError: false, isIdle: false };
        case 'SUCCESS':
          return { ...state, status: 'success', data: action.payload, error: null, isLoading: false, isSuccess: true, isError: false, isIdle: false };
        case 'ERROR':
          return { ...state, status: 'error', data: null, error: action.payload, isLoading: false, isSuccess: false, isError: true, isIdle: false };
        case 'RESET':
          return { status: 'idle', data: null, error: null, isLoading: false, isSuccess: false, isError: false, isIdle: true };
        case 'SET_DATA':
          return { ...state, data: action.payload };
        default:
          return state;
      }
    },
    { status: 'idle', data: null, error: null, isLoading: false, isSuccess: false, isError: false, isIdle: true }
  );

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      if (!asyncFn) return null;
      dispatch({ type: 'PENDING' });
      try {
        const result = await asyncFn(...args);
        dispatch({ type: 'SUCCESS', payload: result });
        return result;
      } catch (error) {
        dispatch({ type: 'ERROR', payload: error instanceof Error ? error : new Error(String(error)) });
        return null;
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setData = useCallback((data: T) => dispatch({ type: 'SET_DATA', payload: data }), []);

  useEffect(() => {
    if (immediate && asyncFn) execute();
  }, [immediate, asyncFn, execute]);

  return { ...state, execute, reset, setData };
}

// ============================================================================
// 19. useThemeMode - Theme dark/light mode management
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeModeReturn {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
}

export function useThemeMode(): ThemeModeReturn {
  const [mode, setModeState] = useLocalStorage<ThemeMode>('theme-mode', 'system');
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const isDark = resolvedMode === 'dark';

  const setMode = useCallback((newMode: ThemeMode) => setModeState(newMode), [setModeState]);

  const toggleMode = useCallback(() => {
    setModeState(resolvedMode === 'dark' ? 'light' : 'dark');
  }, [resolvedMode, setModeState]);

  return { mode, resolvedMode, setMode, toggleMode, isDark, isLight: !isDark };
}

// ============================================================================
// 20. useGeolocation - Browser geolocation API
// ============================================================================

interface GeolocationState {
  loading: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
}

export function useGeolocation(options?: PositionOptions): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    loading: true, accuracy: null, altitude: null, altitudeAccuracy: null,
    heading: null, latitude: null, longitude: null, speed: null, timestamp: null, error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, loading: false, error: { code: 2, message: 'Geolocation not supported', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false, error: null,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState((prev) => ({ ...prev, loading: false, error }));
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [options]);

  return state;
}

// ============================================================================
// 21. useMediaQueryHook - Responsive breakpoint detection
// ============================================================================

export function useMediaQueryHook(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ============================================================================
// 22. useInterval - setInterval as a hook
// ============================================================================

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ============================================================================
// 23. useTimeout - setTimeout as a hook
// ============================================================================

export function useTimeout(callback: () => void, delay: number | null): {
  reset: () => void;
  clear: () => void;
} {
  const savedCallback = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (delay !== null) {
      timerRef.current = setTimeout(() => savedCallback.current(), delay);
    }
  }, [delay]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    reset();
    return clear;
  }, [delay, reset, clear]);

  return { reset, clear };
}

// ============================================================================
// 24. useFetch - Data fetching with caching
// ============================================================================

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
}

interface FetchOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  transform?: (data: any) => T;
  cache?: boolean;
  cacheKey?: string;
  revalidateOnFocus?: boolean;
  revalidateInterval?: number;
}

const fetchCache = new Map<string, { data: any; timestamp: number }>();

export function useFetch<T = any>(
  url: string | null,
  options: FetchOptions<T> = {}
): FetchState<T> & { refetch: () => Promise<void>; mutate: (data: T) => void } {
  const {
    method = 'GET',
    body,
    headers,
    transform,
    cache = true,
    cacheKey,
    revalidateOnFocus = false,
    revalidateInterval,
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null, error: null, isLoading: !!url, isValidating: false,
  });

  const key = cacheKey || url || '';

  const fetchData = useCallback(async () => {
    if (!url) return;

    if (cache && fetchCache.has(key)) {
      const cached = fetchCache.get(key)!;
      if (Date.now() - cached.timestamp < 300000) {
        setState({ data: cached.data, error: null, isLoading: false, isValidating: true });
      }
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      const data = transform ? transform(json) : json;
      if (cache) fetchCache.set(key, { data, timestamp: Date.now() });
      setState({ data, error: null, isLoading: false, isValidating: false });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false,
        isValidating: false,
      }));
    }
  }, [url, method, body, headers, transform, cache, key]);

  const mutate = useCallback(
    (data: T) => {
      setState((prev) => ({ ...prev, data }));
      if (cache) fetchCache.set(key, { data, timestamp: Date.now() });
    },
    [cache, key]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!revalidateOnFocus) return;
    const handler = () => fetchData();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [revalidateOnFocus, fetchData]);

  useEffect(() => {
    if (!revalidateInterval) return;
    const id = setInterval(fetchData, revalidateInterval);
    return () => clearInterval(id);
  }, [revalidateInterval, fetchData]);

  return { ...state, refetch: fetchData, mutate };
}

// ============================================================================
// 25. useDocumentTitle - Dynamic document title
// ============================================================================

export function useDocumentTitle(title: string, restoreOnUnmount: boolean = true): void {
  const prevTitle = useRef(document.title);

  useEffect(() => {
    document.title = `${title} | CancerGuard AI`;
  }, [title]);

  useEffect(() => {
    if (restoreOnUnmount) {
      return () => {
        document.title = prevTitle.current;
      };
    }
  }, [restoreOnUnmount]);
}

// ============================================================================
// 26. useEventListener - Safe event listener
// ============================================================================

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: React.RefObject<HTMLElement | null>,
  options?: boolean | AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const target = element?.current || window;
    const listener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
    target.addEventListener(eventName, listener, options);
    return () => target.removeEventListener(eventName, listener, options);
  }, [eventName, element, options]);
}

// ============================================================================
// 27. useHover - Element hover state
// ============================================================================

export function useHover<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return [ref, isHovered];
}

// ============================================================================
// 28. useMeasure - Element dimension measurement
// ============================================================================

interface Dimensions {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  x: number;
  y: number;
}

export function useMeasure<T extends HTMLElement>(): [React.RefObject<T | null>, Dimensions] {
  const ref = useRef<T | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0,
  });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const rect = entry.target.getBoundingClientRect();
        setDimensions({
          width: rect.width, height: rect.height,
          top: rect.top, left: rect.left,
          right: rect.right, bottom: rect.bottom,
          x: rect.x, y: rect.y,
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, dimensions];
}

// ============================================================================
// 29. useLongPress - Long press gesture detection
// ============================================================================

interface LongPressOptions {
  threshold?: number;
  onStart?: (event: React.MouseEvent | React.TouchEvent) => void;
  onFinish?: (event: React.MouseEvent | React.TouchEvent) => void;
  onCancel?: (event: React.MouseEvent | React.TouchEvent) => void;
}

export function useLongPress(
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
  options: LongPressOptions = {}
) {
  const { threshold = 400, onStart, onFinish, onCancel } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isLongPress = useRef(false);
  const isPressed = useRef(false);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      isPressed.current = true;
      isLongPress.current = false;
      onStart?.(event);
      timerRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(event);
      }, threshold);
    },
    [onLongPress, threshold, onStart]
  );

  const cancel = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isLongPress.current) {
        onFinish?.(event);
      } else if (isPressed.current) {
        onCancel?.(event);
      }
      isPressed.current = false;
    },
    [onFinish, onCancel]
  );

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  };
}

// ============================================================================
// 30. useThrottle - Throttled value
// ============================================================================

export function useThrottle<T>(value: T, intervalMs: number = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastExecuted.current;

    if (elapsed >= intervalMs) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, intervalMs - elapsed);
      return () => clearTimeout(timerId);
    }
  }, [value, intervalMs]);

  return throttledValue;
}

// ============================================================================
// 31. useAnimation - CSS animation state manager
// ============================================================================

interface AnimationState {
  isAnimating: boolean;
  animationName: string | null;
  play: (name: string, durationMs?: number) => Promise<void>;
  stop: () => void;
}

export function useAnimation(): AnimationState {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationName, setAnimationName] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const play = useCallback(async (name: string, durationMs = 500) => {
    setAnimationName(name);
    setIsAnimating(true);
    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        resolve();
      }, durationMs);
    });
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsAnimating(false);
    setAnimationName(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isAnimating, animationName, play, stop };
}

// ============================================================================
// 32. usePortal - Create portals for modals/tooltips
// ============================================================================

export function usePortal(portalId: string = 'portal-root'): HTMLElement {
  const rootRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let portal = document.getElementById(portalId);
    if (!portal) {
      portal = document.createElement('div');
      portal.id = portalId;
      document.body.appendChild(portal);
    }
    rootRef.current = portal;
  }, [portalId]);

  return rootRef.current || document.body;
}

// ============================================================================
// DEFAULT EXPORT - All hooks
// ============================================================================

const hooks = {
  useDebounce,
  useDebouncedCallback,
  useLocalStorage,
  useSessionStorage,
  useIntersectionObserver,
  useWebSocket,
  useNotifications,
  usePagination,
  useForm,
  useClickOutside,
  useKeyPress,
  useClipboard,
  useOnlineStatus,
  useCountdown,
  useScrollPosition,
  useWindowSize,
  usePrevious,
  useToggle,
  useAsync,
  useThemeMode,
  useGeolocation,
  useMediaQueryHook,
  useInterval,
  useTimeout,
  useFetch,
  useDocumentTitle,
  useEventListener,
  useHover,
  useMeasure,
  useLongPress,
  useThrottle,
  useAnimation,
  usePortal,
};

export default hooks;
