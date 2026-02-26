// ============================================================================
// Mobile Storage & Cache Service - Secure storage, caching, offline support
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// ============================================================================
// Types
// ============================================================================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface StorageMetrics {
  totalKeys: number;
  cacheKeys: number;
  secureKeys: number;
  estimatedSize: string;
  oldestEntry: string | null;
  newestEntry: string | null;
}

export interface OfflineQueueItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_PREFIX = '@cache:';
const OFFLINE_QUEUE_KEY = '@offline_queue';
const USER_PREFS_KEY = '@user_preferences';
const HEALTH_DATA_KEY = '@health_data';
const RECENT_SEARCHES_KEY = '@recent_searches';
const FAVORITES_KEY = '@favorites';
const DOWNLOAD_CACHE_KEY = '@downloaded_resources';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 200;
const MAX_RECENT_SEARCHES = 20;
const MAX_OFFLINE_QUEUE = 50;

// ============================================================================
// Storage Service
// ============================================================================

class StorageService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => this.cleanupExpiredCache(), 60000);
  }

  // ---- Secure Storage (for sensitive data) ----

  async setSecure(key: string, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`SecureStore set error for key ${key}:`, error);
      return false;
    }
  }

  async getSecure(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStore get error for key ${key}:`, error);
      return null;
    }
  }

  async removeSecure(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`SecureStore delete error for key ${key}:`, error);
      return false;
    }
  }

  async setSecureJSON<T>(key: string, value: T): Promise<boolean> {
    return this.setSecure(key, JSON.stringify(value));
  }

  async getSecureJSON<T>(key: string): Promise<T | null> {
    const value = await this.getSecure(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  // ---- AsyncStorage (for general data) ----

  async set(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`AsyncStorage set error for key ${key}:`, error);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`AsyncStorage get error for key ${key}:`, error);
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`AsyncStorage remove error for key ${key}:`, error);
      return false;
    }
  }

  async setJSON<T>(key: string, value: T): Promise<boolean> {
    return this.set(key, JSON.stringify(value));
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async multiGet(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, string | null> = {};
      for (const [key, value] of pairs) {
        result[key] = value;
      }
      return result;
    } catch (error) {
      console.error('AsyncStorage multiGet error:', error);
      return {};
    }
  }

  async multiSet(pairs: Array<[string, string]>): Promise<boolean> {
    try {
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('AsyncStorage multiSet error:', error);
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  }

  // ---- Cache Layer ----

  async cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      key: cacheKey,
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, entry);

    // Store in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }

    // Evict oldest entries if over limit
    if (this.memoryCache.size > MAX_CACHE_ENTRIES) {
      this.evictOldestEntries();
    }
  }

  async cacheGet<T>(key: string): Promise<T | null> {
    const cacheKey = `${CACHE_PREFIX}${key}`;

    // Check memory cache first
    const memEntry = this.memoryCache.get(cacheKey);
    if (memEntry) {
      if (memEntry.expiresAt > Date.now()) {
        return memEntry.data as T;
      }
      this.memoryCache.delete(cacheKey);
      AsyncStorage.removeItem(cacheKey).catch(() => {});
      return null;
    }

    // Fall back to AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      if (entry.expiresAt > Date.now()) {
        this.memoryCache.set(cacheKey, entry);
        return entry.data;
      }

      // Expired
      await AsyncStorage.removeItem(cacheKey);
      return null;
    } catch {
      return null;
    }
  }

  async cacheInvalidate(key: string): Promise<void> {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    this.memoryCache.delete(cacheKey);
    await AsyncStorage.removeItem(cacheKey).catch(() => {});
  }

  async cacheInvalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    
    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from AsyncStorage
    const allKeys = await this.getAllKeys();
    const matchingKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX) && regex.test(k));
    if (matchingKeys.length > 0) {
      await AsyncStorage.multiRemove(matchingKeys).catch(() => {});
    }
  }

  async clearAllCache(): Promise<void> {
    this.memoryCache.clear();
    const allKeys = await this.getAllKeys();
    const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys).catch(() => {});
    }
  }

  private async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
        AsyncStorage.removeItem(key).catch(() => {});
      }
    }
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES + 10);
    for (const [key] of toRemove) {
      this.memoryCache.delete(key);
      AsyncStorage.removeItem(key).catch(() => {});
    }
  }

  // ---- Offline Queue ----

  async enqueueOfflineRequest(request: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queue = await this.getOfflineQueue();
    
    if (queue.length >= MAX_OFFLINE_QUEUE) {
      // Remove lowest priority, oldest items
      queue.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
      queue.shift();
    }

    const item: OfflineQueueItem = {
      ...request,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: request.maxRetries || 3,
    };

    queue.push(item);
    await this.setJSON(OFFLINE_QUEUE_KEY, queue);
    return item.id;
  }

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    return (await this.getJSON<OfflineQueueItem[]>(OFFLINE_QUEUE_KEY)) || [];
  }

  async removeFromOfflineQueue(id: string): Promise<void> {
    const queue = await this.getOfflineQueue();
    const filtered = queue.filter(item => item.id !== id);
    await this.setJSON(OFFLINE_QUEUE_KEY, filtered);
  }

  async clearOfflineQueue(): Promise<void> {
    await this.remove(OFFLINE_QUEUE_KEY);
  }

  async getOfflineQueueSize(): Promise<number> {
    const queue = await this.getOfflineQueue();
    return queue.length;
  }

  // ---- User Preferences ----

  async getUserPreferences(): Promise<Record<string, any>> {
    return (await this.getJSON<Record<string, any>>(USER_PREFS_KEY)) || {};
  }

  async setUserPreference(key: string, value: any): Promise<void> {
    const prefs = await this.getUserPreferences();
    prefs[key] = value;
    await this.setJSON(USER_PREFS_KEY, prefs);
  }

  async getUserPreference<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const prefs = await this.getUserPreferences();
    return prefs[key] !== undefined ? prefs[key] : defaultValue;
  }

  // ---- Recent Searches ----

  async addRecentSearch(query: string): Promise<void> {
    const searches = await this.getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    filtered.unshift(query);
    const trimmed = filtered.slice(0, MAX_RECENT_SEARCHES);
    await this.setJSON(RECENT_SEARCHES_KEY, trimmed);
  }

  async getRecentSearches(): Promise<string[]> {
    return (await this.getJSON<string[]>(RECENT_SEARCHES_KEY)) || [];
  }

  async clearRecentSearches(): Promise<void> {
    await this.remove(RECENT_SEARCHES_KEY);
  }

  // ---- Favorites ----

  async addFavorite(type: string, id: string, data?: Record<string, any>): Promise<void> {
    const favorites = await this.getFavorites(type);
    if (!favorites.find(f => f.id === id)) {
      favorites.push({ id, type, data, addedAt: new Date().toISOString() });
      await this.setJSON(`${FAVORITES_KEY}:${type}`, favorites);
    }
  }

  async removeFavorite(type: string, id: string): Promise<void> {
    const favorites = await this.getFavorites(type);
    const filtered = favorites.filter(f => f.id !== id);
    await this.setJSON(`${FAVORITES_KEY}:${type}`, filtered);
  }

  async isFavorite(type: string, id: string): Promise<boolean> {
    const favorites = await this.getFavorites(type);
    return favorites.some(f => f.id === id);
  }

  async getFavorites(type: string): Promise<Array<{ id: string; type: string; data?: any; addedAt: string }>> {
    return (await this.getJSON(`${FAVORITES_KEY}:${type}`)) || [];
  }

  // ---- Health Data Offline Storage ----

  async saveHealthDataOffline(category: string, data: any): Promise<void> {
    const key = `${HEALTH_DATA_KEY}:${category}`;
    await this.setJSON(key, {
      data,
      savedAt: new Date().toISOString(),
    });
  }

  async getHealthDataOffline<T>(category: string): Promise<{ data: T; savedAt: string } | null> {
    return this.getJSON(`${HEALTH_DATA_KEY}:${category}`);
  }

  // ---- Download Cache ----

  async cacheDownload(url: string, localPath: string, metadata?: Record<string, any>): Promise<void> {
    const downloads = await this.getDownloadedResources();
    downloads[url] = { localPath, metadata, cachedAt: new Date().toISOString() };
    await this.setJSON(DOWNLOAD_CACHE_KEY, downloads);
  }

  async getDownloadedResources(): Promise<Record<string, { localPath: string; metadata?: any; cachedAt: string }>> {
    return (await this.getJSON(DOWNLOAD_CACHE_KEY)) || {};
  }

  async getCachedDownload(url: string): Promise<string | null> {
    const downloads = await this.getDownloadedResources();
    return downloads[url]?.localPath || null;
  }

  // ---- Storage Metrics ----

  async getStorageMetrics(): Promise<StorageMetrics> {
    const allKeys = await this.getAllKeys();
    const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
    
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let estimatedBytes = 0;

    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          estimatedBytes += key.length + value.length;
          try {
            const parsed = JSON.parse(value);
            if (parsed.timestamp) {
              if (parsed.timestamp < oldestTimestamp) oldestTimestamp = parsed.timestamp;
              if (parsed.timestamp > newestTimestamp) newestTimestamp = parsed.timestamp;
            }
          } catch {}
        }
      } catch {}
    }

    return {
      totalKeys: allKeys.length,
      cacheKeys: cacheKeys.length,
      secureKeys: 0, // Can't enumerate secure store keys
      estimatedSize: this.formatBytes(estimatedBytes * 2), // UTF-16
      oldestEntry: oldestTimestamp < Infinity ? new Date(oldestTimestamp).toISOString() : null,
      newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp).toISOString() : null,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // ---- Clear All ----

  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const storageService = new StorageService();
export default storageService;
