import { Injectable, Logger } from '@nestjs/common';

import { CachedStockData } from '../models/cached-stock-data.type';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Service for caching stock data in memory with TTL, invalidation, refresh, and statistics.
 */
@Injectable()
export class StockCacheService {
  private readonly cache = new Map<string, CachedStockData>();
  private readonly logger = new Logger(StockCacheService.name);
  private cacheHits = 0;
  private cacheMisses = 0;
  private updateLock = false;

  /**
   * Get cached stock data by symbol. Returns undefined if not found or stale.
   * @param symbol Stock symbol
   */
  getStock(symbol: string): CachedStockData | undefined {
    const data = this.cache.get(symbol);
    if (!data) {
      this.cacheMisses++;
      this.logger.debug(`Cache miss for symbol: ${symbol}`);
      return undefined;
    }
    if (this.isStale(data)) {
      this.cacheMisses++;
      this.logger.debug(`Cache stale for symbol: ${symbol}`);
      this.cache.delete(symbol);
      return undefined;
    }
    this.cacheHits++;
    this.logger.debug(`Cache hit for symbol: ${symbol}`);
    return data;
  }

  /**
   * Set cached stock data for a symbol.
   * @param symbol Stock symbol
   * @param data CachedStockData
   */
  setStock(symbol: string, data: CachedStockData): void {
    this.cache.set(symbol, data);
    this.logger.debug(`Cache set for symbol: ${symbol}`);
  }

  /**
   * Check if cache has valid (not stale) data for a symbol.
   * @param symbol Stock symbol
   */
  hasStock(symbol: string): boolean {
    const data = this.cache.get(symbol);
    return !!data && !this.isStale(data);
  }

  /**
   * Check if cached data is stale (older than TTL).
   * @param data CachedStockData
   */
  isStale(data: CachedStockData): boolean {
    return Date.now() - new Date(data.timestamp).getTime() > CACHE_TTL_MS;
  }

  /**
   * Invalidate cache for a specific symbol.
   * @param symbol Stock symbol
   */
  invalidateSymbol(symbol: string): void {
    this.cache.delete(symbol);
    this.logger.debug(`Cache invalidated for symbol: ${symbol}`);
  }

  /**
   * Invalidate all cache entries.
   */
  invalidateAll(): void {
    this.cache.clear();
    this.logger.debug('All cache entries invalidated');
  }

  /**
   * Invalidate all stale cache entries (older than TTL).
   * Returns the number of entries invalidated.
   */
  invalidateStale(): number {
    let count = 0;
    for (const [symbol, data] of this.cache.entries()) {
      if (this.isStale(data)) {
        this.cache.delete(symbol);
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug(`Invalidated ${count} stale cache entries`);
    }
    return count;
  }

  /**
   * Refresh cache for a set of stocks (partial update).
   * Only updates entries that are stale or missing.
   * Uses a simple lock to prevent concurrent updates.
   * @param stocks Array of CachedStockData
   */
  async refreshStocks(stocks: CachedStockData[]): Promise<void> {
    if (this.updateLock) {
      this.logger.warn('Cache update in progress, skipping refresh');
      return;
    }
    this.updateLock = true;
    try {
      for (const stock of stocks) {
        const cached = this.cache.get(stock.symbol);
        if (!cached || this.isStale(cached)) {
          this.setStock(stock.symbol, stock);
        }
      }
      this.logger.debug(`Refreshed ${stocks.length} stocks in cache`);
    } finally {
      this.updateLock = false;
    }
  }

  /**
   * Get cache statistics (hit rate, miss rate, size).
   */
  getStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total ? this.cacheHits / total : 0,
      missRate: total ? this.cacheMisses / total : 0,
    };
  }
}
