// ============================================================================
// Cache Service - Client-side caching with TTL, LRU eviction, and indexedDB
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
  size: number;
}

interface CacheConfig {
  maxEntries: number;
  defaultTTL: number; // ms
  maxMemoryMB: number;
  persistToStorage: boolean;
  storageKey: string;
  cleanupInterval: number; // ms
  debug: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsageMB: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

// ============================================================================
// MEMORY CACHE
// ============================================================================
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: 500,
      defaultTTL: 5 * 60 * 1000, // 5 min
      maxMemoryMB: 50,
      persistToStorage: false,
      storageKey: 'app_cache',
      cleanupInterval: 60 * 1000, // 1 min
      debug: false,
      ...config,
    };

    this.startCleanup();

    if (this.config.persistToStorage) {
      this.loadFromStorage();
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    if (this.config.debug) console.log(`[Cache] HIT: ${key}`);
    return entry.data as T;
  }

  set<T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }): void {
    const ttl = options?.ttl ?? this.config.defaultTTL;
    const tags = options?.tags ?? [];
    const size = this.estimateSize(data);

    // Evict if we're at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // Check memory limit
    while (this.getMemoryUsage() + size > this.config.maxMemoryMB * 1024 * 1024 && this.cache.size > 0) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
      tags,
      size,
    });

    if (this.config.debug) console.log(`[Cache] SET: ${key} (TTL: ${ttl}ms, Size: ${size}B)`);

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (this.config.persistToStorage) this.saveToStorage();
    return result;
  }

  // Get or set (fetch from source if not cached)
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number; tags?: string[] }): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }

  // Invalidate by tag
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (this.config.debug) console.log(`[Cache] Invalidated ${count} entries with tag: ${tag}`);
    return count;
  }

  // Invalidate by pattern
  invalidateByPattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Clear all
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    if (this.config.persistToStorage) {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      memoryUsageMB: this.getMemoryUsage() / (1024 * 1024),
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.timestamp)) : 0,
    };
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get entries count
  get size(): number {
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.config.debug) console.log(`[Cache] Evicted LRU: ${oldestKey}`);
    }
  }

  private getMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // rough estimate
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      let cleaned = 0;
      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry)) {
          this.cache.delete(key);
          cleaned++;
        }
      }
      if (cleaned > 0 && this.config.debug) {
        console.log(`[Cache] Cleaned ${cleaned} expired entries`);
      }
    }, this.config.cleanupInterval);
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, CacheEntry> = {};
      for (const [key, entry] of this.cache.entries()) {
        if (!this.isExpired(entry)) {
          data[key] = entry;
        }
      }
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (err) {
      if (this.config.debug) console.error('[Cache] Storage save failed:', err);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        for (const [key, entry] of Object.entries(data)) {
          const e = entry as CacheEntry;
          if (!this.isExpired(e)) {
            this.cache.set(key, e);
          }
        }
        if (this.config.debug) console.log(`[Cache] Loaded ${this.cache.size} entries from storage`);
      }
    } catch (err) {
      if (this.config.debug) console.error('[Cache] Storage load failed:', err);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.config.persistToStorage) this.saveToStorage();
    this.cache.clear();
  }
}

// ============================================================================
// INDEXED DB CACHE (for larger data, binary files, etc.)
// ============================================================================
class IndexedDBCache {
  private dbName: string;
  private storeName: string = 'cache';
  private db: IDBDatabase | null = null;
  private ready: Promise<void>;

  constructor(dbName: string = 'app_cache_db') {
    this.dbName = dbName;
    this.ready = this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ready;
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) { resolve(null); return; }

        // Check expiration
        if (result.ttl > 0 && Date.now() - result.timestamp > result.ttl) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(result.data as T);
      };

      request.onerror = () => resolve(null);
    });
  }

  async set<T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }): Promise<void> {
    await this.ready;
    if (!this.db) return;

    const entry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options?.ttl ?? 0,
      tags: options?.tags ?? [],
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    await this.ready;
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.delete(key);
      transaction.oncomplete = () => resolve();
    });
  }

  async clear(): Promise<void> {
    await this.ready;
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      transaction.oncomplete = () => resolve();
    });
  }

  async invalidateByTag(tag: string): Promise<number> {
    await this.ready;
    if (!this.db) return 0;

    return new Promise((resolve) => {
      let count = 0;
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('tags');
      const request = index.openCursor(IDBKeyRange.only(tag));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          count++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(count);
    });
  }

  async getSize(): Promise<number> {
    await this.ready;
    if (!this.db) return 0;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }
}

// ============================================================================
// CACHE PRESETS
// ============================================================================
export const cachePresets = {
  // Short-lived cache for real-time data
  realtime: { defaultTTL: 10 * 1000, maxEntries: 50 },
  // Medium cache for API responses
  api: { defaultTTL: 5 * 60 * 1000, maxEntries: 200, persistToStorage: true },
  // Long-lived cache for static data
  static: { defaultTTL: 24 * 60 * 60 * 1000, maxEntries: 100, persistToStorage: true },
  // Permanent cache with no expiry
  permanent: { defaultTTL: 0, maxEntries: 1000, persistToStorage: true },
};

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================
export const memoryCache = new MemoryCache(cachePresets.api);
export const sessionCache = new MemoryCache({ ...cachePresets.realtime, storageKey: 'session_cache' });
export const staticCache = new MemoryCache(cachePresets.static);
export const dbCache = new IndexedDBCache();

// ============================================================================
// CONVENIENCE API
// ============================================================================
export const cache = {
  get: <T>(key: string) => memoryCache.get<T>(key),
  set: <T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }) => memoryCache.set(key, data, options),
  has: (key: string) => memoryCache.has(key),
  delete: (key: string) => memoryCache.delete(key),
  getOrSet: <T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number; tags?: string[] }) =>
    memoryCache.getOrSet(key, fetcher, options),
  invalidateByTag: (tag: string) => memoryCache.invalidateByTag(tag),
  invalidateByPattern: (pattern: RegExp) => memoryCache.invalidateByPattern(pattern),
  clear: () => memoryCache.clear(),
  stats: () => memoryCache.getStats(),

  // IndexedDB methods for large data
  db: {
    get: <T>(key: string) => dbCache.get<T>(key),
    set: <T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }) => dbCache.set(key, data, options),
    delete: (key: string) => dbCache.delete(key),
    clear: () => dbCache.clear(),
  },
};

export default cache;
