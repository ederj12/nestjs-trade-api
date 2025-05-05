import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { StocksController } from './stocks.controller';
import { StockCacheService } from './services';
import { CachedStockData } from './models/cached-stock-data.type';

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
      providers: [StockCacheService],
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
        symbol: `SYM${i + 1}`,
        price: 100 + i,
        currency: 'USD',
        timestamp: new Date(),
      }));
      seedCache(stocks);
      const res = await request.default(app.getHttpServer()).get('/stocks');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(15); // default limit is 20, but only 15 stocks
      expect(res.body.meta).toEqual({ total: 15, page: 1, limit: 20 });
    });

    it('should return paginated stocks (custom page/limit)', async () => {
      const stocks = Array.from({ length: 25 }, (_, i) => ({
        symbol: `SYM${i + 1}`,
        price: 100 + i,
        currency: 'USD',
        timestamp: new Date(),
      }));
      seedCache(stocks);
      const res = await request.default(app.getHttpServer()).get('/stocks?page=2&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(10);
      expect(res.body.meta).toEqual({ total: 25, page: 2, limit: 10 });
      expect(res.body.data[0].symbol).toBe('SYM11');
    });

    it('should return empty data if no stocks', async () => {
      seedCache([]);
      const res = await request.default(app.getHttpServer()).get('/stocks');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta).toEqual({ total: 0, page: 1, limit: 20 });
    });
  });

  describe('GET /stocks/:symbol', () => {
    it('should return stock if found', async () => {
      const stock = {
        symbol: 'TEST',
        price: 123.45,
        currency: 'USD',
        timestamp: new Date(),
      };
      seedCache([stock]);
      const res = await request.default(app.getHttpServer()).get('/stocks/TEST');
      expect(res.status).toBe(200);
      expect(res.body.data.symbol).toBe('TEST');
      expect(res.body.data.price).toBe(123.45);
    });

    it('should return 404 if not found', async () => {
      seedCache([]);
      const res = await request.default(app.getHttpServer()).get('/stocks/NOTFOUND');
      expect(res.status).toBe(404);
      expect(res.body.statusCode).toBe(404);
      expect(res.body.message).toBe('Stock not found');
    });

    it('should return 400 for invalid symbol (lowercase)', async () => {
      const res = await request.default(app.getHttpServer()).get('/stocks/invalid');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
      );
    });

    it('should return 400 for invalid symbol (special chars)', async () => {
      const res = await request.default(app.getHttpServer()).get('/stocks/INV@LID');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
      );
    });

    it('should return 400 for invalid symbol (too long)', async () => {
      const res = await request.default(app.getHttpServer()).get('/stocks/TOOLONGSYMBOL');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
      );
    });
  });
});
