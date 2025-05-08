import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

xdescribe('StocksController (purchase e2e)', () => {
  let app: INestApplication;
  let transactionService: TransactionService;
  let mockQueryRunner: any;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        StockCacheService,
        {
          provide: TransactionService,
          useValue: {
            processStockPurchase: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useClass: MockDataSource,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    transactionService = moduleRef.get(TransactionService);
    const dataSource = moduleRef.get(DataSource) as MockDataSource;
    mockQueryRunner = dataSource.queryRunner;
    // Patch controller to use the actual mockQueryRunner
    const originalPurchaseStock = StocksController.prototype.purchaseStock;
    StocksController.prototype.purchaseStock = function (dto, req) {
      req.queryRunner = mockQueryRunner;
      return originalPurchaseStock.call(this, dto, req);
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should commit transaction on success', async () => {
    jest.spyOn(mockQueryRunner, 'connect');
    jest.spyOn(mockQueryRunner, 'startTransaction');
    jest.spyOn(mockQueryRunner, 'commitTransaction');
    jest.spyOn(mockQueryRunner, 'rollbackTransaction');
    jest.spyOn(mockQueryRunner, 'release');

    (transactionService.processStockPurchase as jest.Mock).mockResolvedValueOnce({
      transactionId: 1,
      status: 'COMPLETED',
      message: 'Transaction completed successfully',
      createdAt: new Date(),
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 100 });
    expect(res.status).toBe(201);
    expect(res.body.transactionId).toBe(1);
    expect(res.body.status).toBe('COMPLETED');
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction if price is out of range', async () => {
    jest.spyOn(mockQueryRunner, 'connect');
    jest.spyOn(mockQueryRunner, 'startTransaction');
    jest.spyOn(mockQueryRunner, 'commitTransaction');
    jest.spyOn(mockQueryRunner, 'rollbackTransaction');
    jest.spyOn(mockQueryRunner, 'release');

    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new NotFoundException('Price is out of range');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 99999 });
    expect(res.status).toBe(404);
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction if stock not in cache', async () => {
    jest.spyOn(mockQueryRunner, 'connect');
    jest.spyOn(mockQueryRunner, 'startTransaction');
    jest.spyOn(mockQueryRunner, 'commitTransaction');
    jest.spyOn(mockQueryRunner, 'rollbackTransaction');
    jest.spyOn(mockQueryRunner, 'release');

    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new NotFoundException('Stock with symbol FAKE not found in cache');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'FAKE', quantity: 1, price: 100 });
    expect(res.status).toBe(404);
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction if portfolio not found', async () => {
    jest.spyOn(mockQueryRunner, 'connect');
    jest.spyOn(mockQueryRunner, 'startTransaction');
    jest.spyOn(mockQueryRunner, 'commitTransaction');
    jest.spyOn(mockQueryRunner, 'rollbackTransaction');
    jest.spyOn(mockQueryRunner, 'release');

    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new NotFoundException('Portfolio for user 999 not found');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-999', symbol: 'AAPL', quantity: 1, price: 100 });
    expect(res.status).toBe(404);
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction on simulated DB error', async () => {
    jest.spyOn(mockQueryRunner, 'connect');
    jest.spyOn(mockQueryRunner, 'startTransaction');
    jest.spyOn(mockQueryRunner, 'commitTransaction');
    jest.spyOn(mockQueryRunner, 'rollbackTransaction');
    jest.spyOn(mockQueryRunner, 'release');

    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Simulated DB error');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 100 });
    expect(res.status).toBe(500);
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});

xdescribe('StocksController (purchase e2e edge cases)', () => {
  let app: INestApplication;
  let transactionService: TransactionService;
  let mockQueryRunner: any;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [StocksController],
      providers: [
        StockCacheService,
        {
          provide: TransactionService,
          useValue: {
            processStockPurchase: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useClass: MockDataSource,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    transactionService = moduleRef.get(TransactionService);
    const dataSource = moduleRef.get(DataSource) as MockDataSource;
    mockQueryRunner = dataSource.queryRunner;
    const originalPurchaseStock = StocksController.prototype.purchaseStock;
    StocksController.prototype.purchaseStock = function (dto, req) {
      req.queryRunner = mockQueryRunner;
      return originalPurchaseStock.call(this, dto, req);
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 for invalid UUIDs', async () => {
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'not-a-uuid', symbol: 'AAPL', quantity: 1, price: 100 });
    expect(res.status).toBe(400);
  });

  it('should return 400 for negative quantity', async () => {
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: -1, price: 100 });
    expect(res.status).toBe(400);
  });

  it('should return 400 for zero price', async () => {
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 0 });
    expect(res.status).toBe(400);
  });

  it('should return 400 for quantity as string', async () => {
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 'one', price: 100 });
    expect(res.status).toBe(400);
  });

  it('should strip extra fields (whitelist)', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockResolvedValueOnce({
      transactionId: 1,
      status: 'COMPLETED',
      message: 'Transaction completed successfully',
      createdAt: new Date(),
    });
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: 'uuid-user-1',
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
      extra: 'should be stripped',
    });
    expect(res.status).toBe(201);
    expect(res.body.transactionId).toBe(1);
  });

  it('should return 404 if user not found', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new NotFoundException('User not found');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-404', symbol: 'AAPL', quantity: 1, price: 100 });
    expect(res.status).toBe(404);
  });

  it('should return 404 if stock entity not found', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new NotFoundException('Stock entity not found');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'NOTFOUND', quantity: 1, price: 100 });
    expect(res.status).toBe(404);
  });

  it('should return 400 if service throws BadRequestException', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new BadRequestException('Invalid request');
    });
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 100 });
    expect(res.status).toBe(400);
  });

  it('should return 500 if service returns null', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockResolvedValueOnce(null);
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 100 });
    // Controller does not handle null, so expect 500 or a crash
    expect([500, 502, 503]).toContain(res.status);
  });

  it('should return 500 if QueryRunner is missing', async () => {
    // Patch controller to not set queryRunner
    const originalPurchaseStock = StocksController.prototype.purchaseStock;
    StocksController.prototype.purchaseStock = function (dto, req) {
      // Do not set req.queryRunner
      return originalPurchaseStock.call(this, dto, req);
    };
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: 'uuid-user-1', symbol: 'AAPL', quantity: 1, price: 100 });
    expect([500, 502, 503]).toContain(res.status);
    // Restore patch
    StocksController.prototype.purchaseStock = function (dto, req) {
      req.queryRunner = mockQueryRunner;
      return originalPurchaseStock.call(this, dto, req);
    };
  });
});
