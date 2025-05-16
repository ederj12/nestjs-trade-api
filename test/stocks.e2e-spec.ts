import {
  INestApplication,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { StocksController } from '../src/modules/core/controllers/stocks.controller';
import { MockDataSource } from '../src/modules/core/controllers/utils/mock-datasource';
import { StockCacheService } from '../src/modules/core/services';
import { TransactionService } from '../src/modules/core/services/transaction.service';

const validUserId = 'f00e7d30-3802-44af-91ab-d24278731c3d';
const invalidUserId = '123e4567-e89b-12d3-a456-426614174000';

// --- E2E: Purchase tests ---
describe('StocksController (purchase e2e)', () => {
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
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
    });
    console.log(res.body);
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
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 99999,
    });
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
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'FAKE',
      quantity: 1,
      price: 100,
    });
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
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
    });
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
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
    });
    expect(res.status).toBe(500);
    expect(mockQueryRunner.connect).toHaveBeenCalled();
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 for invalid UUIDs', async () => {
    const res = await request(app.getHttpServer())
      .post('/stocks/purchase')
      .send({ userId: invalidUserId, symbol: 'AAPL', quantity: 1, price: 100 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for negative quantity', async () => {
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: -1,
      price: 100,
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 for zero price', async () => {
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 0,
    });
    expect(res.status).toBe(400);
  });

  it('should return 400 for quantity as string', async () => {
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 'one',
      price: 100,
    });
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
      userId: validUserId,
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
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
    });
    expect(res.status).toBe(404);
  });

  it('should return 404 if stock entity not found', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new NotFoundException('Stock entity not found');
    });
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'NOTFOUND',
      quantity: 1,
      price: 100,
    });
    expect(res.status).toBe(404);
  });

  it('should return 400 if service throws BadRequestException', async () => {
    (transactionService.processStockPurchase as jest.Mock).mockImplementationOnce(() => {
      throw new BadRequestException('Invalid request');
    });
    const res = await request(app.getHttpServer()).post('/stocks/purchase').send({
      userId: validUserId,
      symbol: 'AAPL',
      quantity: 1,
      price: 100,
    });
    expect(res.status).toBe(400);
  });
});
