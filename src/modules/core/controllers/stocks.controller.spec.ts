import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { CachedStockData } from '../models/cached-stock-data.type';
import { StockCacheService } from '../services';
import { TransactionService } from '../services/transaction.service';

import { StocksController } from './stocks.controller';
import { MockDataSource } from './utils/mock-datasource';

describe('StocksController (unit, cache only)', () => {
  let app: INestApplication;
  let cacheService: StockCacheService;

  // Helper to seed cache
  const seedCache = (stocks: CachedStockData[]) => {
    cacheService['cache'].clear();
    for (const stock of stocks) {
      cacheService.setStock(stock.symbol, stock);
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        StockCacheService,
        {
          provide: TransactionService,
          useValue: {},
        },
        {
          provide: DataSource,
          useClass: MockDataSource,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    cacheService = moduleFixture.get(StockCacheService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /stocks', () => {
    it('should return paginated stocks (default)', async () => {
      const stocks = Array.from({ length: 15 }, (_, i) => ({
        id: `uuid-stock-${i + 1}`,
        symbol: `SYM${i + 1}`,
        name: `Stock ${i + 1}`,
        price: 100 + i,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      }));
      seedCache(stocks);
      const res = await request(app.getHttpServer()).get('/stocks');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(15); // default limit is 20, but only 15 stocks
      expect(res.body.meta).toEqual({ total: 15, page: 1, limit: 20 });
    });

    it('should return paginated stocks (custom page/limit)', async () => {
      const stocks = Array.from({ length: 25 }, (_, i) => ({
        id: `uuid-stock-${i + 1}`,
        symbol: `SYM${i + 1}`,
        name: `Stock ${i + 1}`,
        price: 100 + i,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      }));
      seedCache(stocks);
      const res = await request(app.getHttpServer()).get('/stocks?page=2&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(10);
      expect(res.body.meta).toEqual({ total: 25, page: 2, limit: 10 });
      expect(res.body.data[0].symbol).toBe('SYM11');
    });

    it('should return empty data if no stocks', async () => {
      seedCache([]);
      const res = await request(app.getHttpServer()).get('/stocks');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta).toEqual({ total: 0, page: 1, limit: 20 });
    });
  });

  describe('GET /stocks/:symbol', () => {
    it('should return stock if found', async () => {
      const stock = {
        id: 'uuid-stock-test',
        symbol: 'TEST',
        name: 'Test Stock',
        price: 123.45,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      };
      seedCache([stock]);
      const res = await request(app.getHttpServer()).get('/stocks/TEST');
      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('TEST');
      expect(res.body.data.price).toBe(123.45);
    });

    it('should return 404 if not found', async () => {
      seedCache([]);
      const res = await request(app.getHttpServer()).get('/stocks/NOTFOUND');
      expect(res.status).toBe(404);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('Stock not found');
    });

    it('should return 400 for invalid symbol (lowercase)', async () => {
      const res = await request(app.getHttpServer()).get('/stocks/invalid');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
      );
    });

    it('should return 400 for invalid symbol (special chars)', async () => {
      const res = await request(app.getHttpServer()).get('/stocks/INV@LID');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
      );
    });

    it('should return 400 for invalid symbol (too long)', async () => {
      const res = await request(app.getHttpServer()).get('/stocks/TOOLONGSYMBOL');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
      );
    });
  });

  describe('GET /stocks/stats', () => {
    it('should return cache stats (empty)', async () => {
      cacheService['cache'].clear();
      const res = await request(app.getHttpServer()).get('/stocks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('size', 0);
    });

    it('should return cache stats (populated)', async () => {
      seedCache([
        {
          id: 'uuid-1',
          symbol: 'A',
          name: 'A',
          price: 1,
          lastUpdated: new Date(),
          sector: 'Tech',
          change: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          currency: 'USD',
        },
      ]);
      const res = await request(app.getHttpServer()).get('/stocks/stats');
      expect(res.status).toBe(200);
      expect(res.body.size).toBe(1);
    });
  });

  describe('GET /stocks (edge cases)', () => {
    it('should return 400 for negative page', async () => {
      const res = await request(app.getHttpServer()).get('/stocks?page=-1');
      expect(res.status).toBe(400);
    });
    it('should return 400 for zero limit', async () => {
      const res = await request(app.getHttpServer()).get('/stocks?limit=0');
      expect(res.status).toBe(400);
    });
    it('should return 400 for non-integer page', async () => {
      const res = await request(app.getHttpServer()).get('/stocks?page=abc');
      expect(res.status).toBe(400);
    });
    it('should return 400 for non-integer limit', async () => {
      const res = await request(app.getHttpServer()).get('/stocks?limit=abc');
      expect(res.status).toBe(400);
    });
    it('should return empty data for very large page', async () => {
      seedCache(
        Array.from({ length: 5 }, (_, i) => ({
          id: `uuid-stock-${i + 1}`,
          symbol: `SYM${i + 1}`,
          name: `Stock ${i + 1}`,
          price: 100 + i,
          lastUpdated: new Date(),
          sector: 'Tech',
          change: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          currency: 'USD',
        })),
      );
      const res = await request(app.getHttpServer()).get('/stocks?page=100&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /stocks/:symbol (edge cases)', () => {
    it('should return stock for symbol with dot', async () => {
      const stock = {
        id: 'uuid-dot',
        symbol: 'A.B',
        name: 'Dot Stock',
        price: 10,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      };
      seedCache([stock]);
      const res = await request(app.getHttpServer()).get('/stocks/A.B');
      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('A.B');
    });
    it('should return stock for symbol with dash', async () => {
      const stock = {
        id: 'uuid-dash',
        symbol: 'A-B',
        name: 'Dash Stock',
        price: 10,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      };
      seedCache([stock]);
      const res = await request(app.getHttpServer()).get('/stocks/A-B');
      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('A-B');
    });
    it('should return stock for symbol with min length', async () => {
      const stock = {
        id: 'uuid-min',
        symbol: 'A',
        name: 'Min Stock',
        price: 10,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      };
      seedCache([stock]);
      const res = await request(app.getHttpServer()).get('/stocks/A');
      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('A');
    });
    it('should return stock for symbol with max length', async () => {
      const symbol = 'ABCDEFGHIJ';
      const stock = {
        id: 'uuid-max',
        symbol,
        name: 'Max Stock',
        price: 10,
        lastUpdated: new Date(),
        sector: 'Tech',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      };
      seedCache([stock]);
      const res = await request(app.getHttpServer()).get(`/stocks/${symbol}`);
      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe(symbol);
    });
    it('should return 404 for valid symbol not in cache', async () => {
      seedCache([]);
      const res = await request(app.getHttpServer()).get('/stocks/VALIDSYM');
      expect(res.status).toBe(404);
    });
  });
});
