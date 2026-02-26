// ============================================================================
// Helpers - General Purpose Utility Functions for CancerGuard AI
// ============================================================================

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group array items by a key
 */
export const groupBy = <T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by key with direction
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T | ((item: T) => any),
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Remove duplicates from array
 */
export const uniqueBy = <T>(array: T[], key: keyof T | ((item: T) => any)): T[] => {
  const seen = new Set<any>();
  return array.filter((item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * Chunk an array into groups
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Flatten nested arrays
 */
export const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>((acc, item) => {
    return acc.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
};

/**
 * Shuffle array
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get array statistics
 */
export const arrayStats = (numbers: number[]): {
  min: number; max: number; sum: number; avg: number; median: number; count: number;
} => {
  if (numbers.length === 0) return { min: 0, max: 0, sum: 0, avg: 0, median: 0, count: 0 };
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  return {
    min: sorted[0], max: sorted[sorted.length - 1],
    sum, avg: sum / sorted.length, median, count: sorted.length,
  };
};

/**
 * Create a range of numbers
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];
  for (let i = start; i < end; i += step) result.push(i);
  return result;
};

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(deepClone) as any;
  const clone = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (clone as any)[key] = deepClone(obj[key]);
    }
  }
  return clone;
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends Record<string, any>>(...objects: Partial<T>[]): T => {
  return objects.reduce((result, obj) => {
    if (!obj) return result;
    Object.keys(obj).forEach((key) => {
      const resultVal = (result as any)[key];
      const objVal = (obj as any)[key];
      if (Array.isArray(resultVal) && Array.isArray(objVal)) {
        (result as any)[key] = [...resultVal, ...objVal];
      } else if (isPlainObject(resultVal) && isPlainObject(objVal)) {
        (result as any)[key] = deepMerge(resultVal, objVal);
      } else {
        (result as any)[key] = objVal;
      }
    });
    return result;
  }, {} as any) as T;
};

/**
 * Pick specific keys from an object
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
};

/**
 * Omit specific keys from an object
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Check if value is a plain object
 */
export const isPlainObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && value.constructor === Object;
};

/**
 * Get nested property safely
 */
export const getNestedValue = (obj: any, path: string, defaultValue: any = undefined): any => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return defaultValue;
    current = current[key];
  }
  return current ?? defaultValue;
};

/**
 * Set nested property
 */
export const setNestedValue = (obj: any, path: string, value: any): any => {
  const clone = deepClone(obj);
  const keys = path.split('.');
  let current = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return clone;
};

/**
 * Check if two objects are deeply equal
 */
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
};

/**
 * Diff two objects
 */
export const objectDiff = (original: Record<string, any>, modified: Record<string, any>): Record<string, { old: any; new: any }> => {
  const diff: Record<string, { old: any; new: any }> = {};
  const allKeys = new Set([...Object.keys(original), ...Object.keys(modified)]);
  allKeys.forEach((key) => {
    if (!deepEqual(original[key], modified[key])) {
      diff[key] = { old: original[key], new: modified[key] };
    }
  });
  return diff;
};

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Generate a random ID
 */
export const generateId = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += chars[values[i] % chars.length];
  }
  return result;
};

/**
 * Generate a UUID v4
 */
export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Hash a string (simple djb2 hash)
 */
export const hashString = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0;
};

/**
 * Convert object to query string
 */
export const toQueryString = (params: Record<string, any>): string => {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
};

/**
 * Parse query string to object
 */
export const parseQueryString = (queryString: string): Record<string, string> => {
  return queryString
    .replace(/^\?/, '')
    .split('&')
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
};

/**
 * Highlight search term in text
 */
export const highlightText = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Generate a color from a string (deterministic)
 */
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
  return `#${color}`;
};

/**
 * Lighten a hex color
 */
export const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

/**
 * Darken a hex color
 */
export const darkenColor = (hex: string, percent: number): string => {
  return lightenColor(hex, -percent);
};

/**
 * Get contrasting text color (black or white) for a background
 */
export const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Convert hex to RGBA
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Map a value from one range to another
 */
export const mapRange = (
  value: number,
  inMin: number, inMax: number,
  outMin: number, outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Round to N decimal places
 */
export const roundTo = (value: number, decimals: number): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Calculate percentage
 */
export const percentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Calculate percentage change
 */
export const percentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Sleep/delay for a number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry an async function
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  backoff: boolean = true
): Promise<T> => {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        await sleep(backoff ? delayMs * attempt : delayMs);
      }
    }
  }
  throw lastError;
};

/**
 * Debounce a function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle a function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Run promises in parallel with concurrency limit
 */
export const parallelLimit = async <T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 5
): Promise<T[]> => {
  const results: T[] = [];
  let index = 0;

  const runTask = async () => {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, runTask);
  await Promise.all(workers);
  return results;
};

// ============================================================================
// DOM UTILITIES
// ============================================================================

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
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
    return true;
  } catch {
    return false;
  }
};

/**
 * Smooth scroll to element
 */
export const scrollToElement = (
  elementId: string,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }
): void => {
  const element = document.getElementById(elementId);
  if (element) element.scrollIntoView(options);
};

/**
 * Scroll to top of page
 */
export const scrollToTop = (smooth: boolean = true): void => {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Download a file from a URL or blob
 */
export const downloadFile = (url: string | Blob, filename: string): void => {
  const a = document.createElement('a');
  a.href = typeof url === 'string' ? url : URL.createObjectURL(url);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof url !== 'string') URL.revokeObjectURL(a.href);
};

/**
 * Print a specific element
 */
export const printElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head><title>Print</title></head>
      <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Safe localStorage get with expiry
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    if (parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    return parsed.value ?? parsed;
  } catch {
    return defaultValue;
  }
};

/**
 * Safe localStorage set with optional expiry
 */
export const setStorageItem = (key: string, value: any, expiryMs?: number): void => {
  try {
    const item = expiryMs
      ? { value, expiry: Date.now() + expiryMs }
      : value;
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('localStorage set error:', error);
  }
};

/**
 * Get total localStorage usage
 */
export const getStorageUsage = (): { used: number; total: number; percentage: number } => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += (localStorage.getItem(key) || '').length;
  }
  const usedKB = total / 1024;
  const totalKB = 5120; // 5MB typical limit
  return { used: usedKB, total: totalKB, percentage: (usedKB / totalKB) * 100 };
};

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

export const platform = {
  isMobile: (): boolean => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  isIOS: (): boolean => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: (): boolean => /Android/.test(navigator.userAgent),
  isSafari: (): boolean => /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  isChrome: (): boolean => /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent),
  isFirefox: (): boolean => /Firefox/.test(navigator.userAgent),
  isEdge: (): boolean => /Edge/.test(navigator.userAgent),
  isTouchDevice: (): boolean => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  isStandalone: (): boolean => window.matchMedia('(display-mode: standalone)').matches,
  supportsWebGL: (): boolean => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch { return false; }
  },
  supportsNotifications: (): boolean => 'Notification' in window,
  supportsGeolocation: (): boolean => 'geolocation' in navigator,
  supportsWebSocket: (): boolean => 'WebSocket' in window,
  supportsServiceWorker: (): boolean => 'serviceWorker' in navigator,
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Measure function execution time
 */
export const measureTime = async <T>(
  fn: () => T | Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  if (label) console.log(`${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
};

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  return (window as any).setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 1) as unknown as number;
};

/**
 * Memoize a function
 */
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export default {
  groupBy, sortBy, uniqueBy, chunk, flatten, shuffle, arrayStats, range,
  deepClone, deepMerge, pick, omit, isPlainObject, getNestedValue, setNestedValue, deepEqual, objectDiff,
  generateId, uuid, hashString, toQueryString, parseQueryString, highlightText,
  stringToColor, lightenColor, darkenColor, getContrastColor, hexToRgba,
  clamp, lerp, mapRange, roundTo, percentage, percentageChange,
  sleep, retry, debounce, throttle, parallelLimit,
  copyToClipboard, scrollToElement, scrollToTop, isInViewport, downloadFile, printElement,
  getStorageItem, setStorageItem, getStorageUsage,
  platform, measureTime, requestIdleCallback, memoize,
};
