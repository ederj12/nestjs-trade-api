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
    const stock: CachedStockData = {
      id: 'uuid-stock-aapl',
      symbol: 'AAPL',
      price: 100,
      lastUpdated: now,
      name: 'Apple Inc.',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    };
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
      id: 'uuid-stock-stale',
      symbol: 'STALE',
      price: 50,
      lastUpdated: staleDate,
      name: 'Stale Stock',
      sector: 'Tech',
      change: 0,
      createdAt: staleDate,
      updatedAt: staleDate,
      currency: 'USD',
    };
    service.setStock(stock.symbol, stock);
    expect(service.isStale(stock)).toBe(true);
    expect(service.getStock('STALE')).toBeUndefined();
    expect(service.hasStock('STALE')).toBe(false);
  });

  it('should invalidate a symbol', () => {
    const stock: CachedStockData = {
      id: 'uuid-stock-goog',
      symbol: 'GOOG',
      price: 200,
      lastUpdated: now,
      name: 'Google',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    };
    service.setStock(stock.symbol, stock);
    service.invalidateSymbol('GOOG');
    expect(service.getStock('GOOG')).toBeUndefined();
  });

  it('should invalidate all', () => {
    service.setStock('A', {
      id: 'uuid-stock-a',
      symbol: 'A',
      price: 1,
      lastUpdated: now,
      name: 'Stock A',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    });
    service.setStock('B', {
      id: 'uuid-stock-b',
      symbol: 'B',
      price: 2,
      lastUpdated: now,
      name: 'Stock B',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    });
    service.invalidateAll();
    expect(service.getStock('A')).toBeUndefined();
    expect(service.getStock('B')).toBeUndefined();
  });

  it('should invalidate all stale entries', () => {
    service.setStock('A', {
      id: 'uuid-stock-a',
      symbol: 'A',
      price: 1,
      lastUpdated: now,
      name: 'Stock A',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    });
    service.setStock('B', {
      id: 'uuid-stock-b',
      symbol: 'B',
      price: 2,
      lastUpdated: staleDate,
      name: 'Stock B',
      sector: 'Tech',
      change: 0,
      createdAt: staleDate,
      updatedAt: staleDate,
      currency: 'USD',
    });
    const count = service.invalidateStale();
    expect(count).toBe(1);
    expect(service.getStock('A')).toBeDefined();
    expect(service.getStock('B')).toBeUndefined();
  });

  it('should refresh only stale or missing stocks', async () => {
    service.setStock('A', {
      id: 'uuid-stock-a',
      symbol: 'A',
      price: 1,
      lastUpdated: now,
      name: 'Stock A',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    });
    service.setStock('B', {
      id: 'uuid-stock-b',
      symbol: 'B',
      price: 2,
      lastUpdated: staleDate,
      name: 'Stock B',
      sector: 'Tech',
      change: 0,
      createdAt: staleDate,
      updatedAt: staleDate,
      currency: 'USD',
    });
    const stocks: CachedStockData[] = [
      {
        id: 'uuid-stock-a',
        symbol: 'A',
        price: 10,
        lastUpdated: now,
        name: 'Stock A',
        sector: 'Tech',
        change: 0,
        createdAt: now,
        updatedAt: now,
        currency: 'USD',
      },
      {
        id: 'uuid-stock-b',
        symbol: 'B',
        price: 20,
        lastUpdated: now,
        name: 'Stock B',
        sector: 'Tech',
        change: 0,
        createdAt: now,
        updatedAt: now,
        currency: 'USD',
      },
      {
        id: 'uuid-stock-c',
        symbol: 'C',
        price: 30,
        lastUpdated: now,
        name: 'Stock C',
        sector: 'Tech',
        change: 0,
        createdAt: now,
        updatedAt: now,
        currency: 'USD',
      },
    ];
    await service.refreshStocks(stocks);
    expect(service.getStock('A')!.price).toBe(1); // not stale, not updated
    expect(service.getStock('B')!.price).toBe(20); // stale, updated
    expect(service.getStock('C')!.price).toBe(30); // missing, added
  });

  it('should not allow concurrent refreshes (lock)', async () => {
    service['updateLock'] = true;
    const stocks: CachedStockData[] = [
      {
        id: 'uuid-stock-a',
        symbol: 'A',
        price: 1,
        lastUpdated: now,
        name: 'Stock A',
        sector: 'Tech',
        change: 0,
        createdAt: now,
        updatedAt: now,
        currency: 'USD',
      },
    ];
    await service.refreshStocks(stocks); // should skip due to lock
    expect(service.getStock('A')).toBeUndefined();
  });

  it('should track cache hits and misses', () => {
    const stock: CachedStockData = {
      id: 'uuid-stock-aapl',
      symbol: 'AAPL',
      price: 100,
      lastUpdated: now,
      name: 'Apple Inc.',
      sector: 'Tech',
      change: 0,
      createdAt: now,
      updatedAt: now,
      currency: 'USD',
    };
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
