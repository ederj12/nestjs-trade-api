import { Injectable, Logger } from '@nestjs/common';
import { CachedStockData } from '../models/cached-stock-data.type';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Service for caching stock data in memory with TTL and logging.
 */
@Injectable()
export class StockCacheService {
  private readonly cache = new Map<string, CachedStockData>();
  private readonly logger = new Logger(StockCacheService.name);

  /**
   * Get cached stock data by symbol. Returns undefined if not found or stale.
   * @param symbol Stock symbol
   */
  getStock(symbol: string): CachedStockData | undefined {
    const data = this.cache.get(symbol);
    if (!data) {
      this.logger.debug(`Cache miss for symbol: ${symbol}`);
      return undefined;
    }
    if (this.isStale(data)) {
      this.logger.debug(`Cache stale for symbol: ${symbol}`);
      this.cache.delete(symbol);
      return undefined;
    }
    this.logger.debug(`Cache hit for symbol: ${symbol}`);
    return data;
  }

  /**
   * Set cached stock data for a symbol.
   * @param symbol Stock symbol
   * @param data CachedStockData
   */
  setStock(symbol: string, data: CachedStockData): void {
    this.cache.set(symbol, { ...data, timestamp: new Date() });
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
}
