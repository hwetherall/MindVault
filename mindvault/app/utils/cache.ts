/**
 * Response caching utilities
 * Caches API responses based on question + document hash
 */

import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 60 * 1000; // 1 hour

  /**
   * Generate cache key from question and document content
   */
  generateKey(question: string, files: Array<{ name: string; content: string }>): string {
    const fileHashes = files.map(file => 
      crypto.createHash('md5').update(file.content).digest('hex')
    ).join('|');
    
    const questionHash = crypto.createHash('md5').update(question).digest('hex');
    
    return `cache_${questionHash}_${fileHashes}`;
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; age: number; expiresIn: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      expiresIn: entry.expiresAt - Date.now()
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache decorator for API routes
 */
export function withCache<T>(
  keyGenerator: () => string,
  handler: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const key = keyGenerator();
  const cached = cache.get<T>(key);
  
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return handler().then(result => {
    cache.set(key, result, ttl);
    return result;
  });
}

/**
 * Invalidate cache for a specific question/document combination
 */
export function invalidateCache(question: string, files: Array<{ name: string; content: string }>): void {
  const key = cache.generateKey(question, files);
  cache.delete(key);
}

