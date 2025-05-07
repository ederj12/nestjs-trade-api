import { CachedStockData } from '../models/cached-stock-data.type';

import { StockCacheService } from './stock-cache.service';

describe('StockCacheService', () => {
  let service: StockCacheService;
  const now = new Date();
  const staleDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 min ago

  beforeEach(() => {
    service = new StockCacheService();
  });

  it('should set and get a stock', () => {
    const stock: CachedStockData = { symbol: 'AAPL', price: 100, currency: 'USD', timestamp: now };
    service.setStock(stock.symbol, stock);
    expect(service.getStock('AAPL')).toMatchObject(stock);
    expect(service.hasStock('AAPL')).toBe(true);
  });

  it('should return undefined for missing stock', () => {
    expect(service.getStock('MISSING')).toBeUndefined();
    expect(service.hasStock('MISSING')).toBe(false);
  });

  it('should detect and invalidate stale stock', () => {
    const stock: CachedStockData = {
      symbol: 'STALE',
      price: 50,
      currency: 'USD',
      timestamp: staleDate,
    };
    service.setStock(stock.symbol, stock);
    expect(service.isStale(stock)).toBe(true);
    expect(service.getStock('STALE')).toBeUndefined();
    expect(service.hasStock('STALE')).toBe(false);
  });

  it('should invalidate a symbol', () => {
    const stock: CachedStockData = { symbol: 'GOOG', price: 200, currency: 'USD', timestamp: now };
    service.setStock(stock.symbol, stock);
    service.invalidateSymbol('GOOG');
    expect(service.getStock('GOOG')).toBeUndefined();
  });

  it('should invalidate all', () => {
    service.setStock('A', { symbol: 'A', price: 1, currency: 'USD', timestamp: now });
    service.setStock('B', { symbol: 'B', price: 2, currency: 'USD', timestamp: now });
    service.invalidateAll();
    expect(service.getStock('A')).toBeUndefined();
    expect(service.getStock('B')).toBeUndefined();
  });

  it('should invalidate all stale entries', () => {
    service.setStock('A', { symbol: 'A', price: 1, currency: 'USD', timestamp: now });
    service.setStock('B', { symbol: 'B', price: 2, currency: 'USD', timestamp: staleDate });
    const count = service.invalidateStale();
    expect(count).toBe(1);
    expect(service.getStock('A')).toBeDefined();
    expect(service.getStock('B')).toBeUndefined();
  });

  it('should refresh only stale or missing stocks', async () => {
    service.setStock('A', { symbol: 'A', price: 1, currency: 'USD', timestamp: now });
    service.setStock('B', { symbol: 'B', price: 2, currency: 'USD', timestamp: staleDate });
    const stocks: CachedStockData[] = [
      { symbol: 'A', price: 10, currency: 'USD', timestamp: now },
      { symbol: 'B', price: 20, currency: 'USD', timestamp: now },
      { symbol: 'C', price: 30, currency: 'USD', timestamp: now },
    ];
    await service.refreshStocks(stocks);
    expect(service.getStock('A')!.price).toBe(1); // not stale, not updated
    expect(service.getStock('B')!.price).toBe(20); // stale, updated
    expect(service.getStock('C')!.price).toBe(30); // missing, added
  });

  it('should not allow concurrent refreshes (lock)', async () => {
    service['updateLock'] = true;
    const stocks: CachedStockData[] = [{ symbol: 'A', price: 1, currency: 'USD', timestamp: now }];
    await service.refreshStocks(stocks); // should skip due to lock
    expect(service.getStock('A')).toBeUndefined();
  });

  it('should track cache hits and misses', () => {
    const stock: CachedStockData = { symbol: 'AAPL', price: 100, currency: 'USD', timestamp: now };
    service.setStock(stock.symbol, stock);
    service.getStock('AAPL'); // hit
    service.getStock('AAPL'); // hit
    service.getStock('MISSING'); // miss
    const stats = service.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
    expect(stats.missRate).toBeCloseTo(1 / 3);
  });
});
