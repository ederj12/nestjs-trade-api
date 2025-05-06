import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { PortfoliosController } from './portfolios.controller';
import { PortfolioService } from './services/portfolio.service';

const mockPortfolio = {
  id: 1,
  name: 'Test Portfolio',
  userId: 1,
  holdings: [],
};

const mockPortfolioWithHoldings = {
  id: 1,
  name: 'Test Portfolio',
  userId: 1,
  holdings: [
    {
      quantity: 10,
      averagePurchasePrice: 100.5,
      stock: {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 150.25,
        lastUpdated: new Date().toISOString(),
        sector: 'Technology',
        exchange: 'NASDAQ',
      },
    },
    {
      quantity: 5,
      averagePurchasePrice: 200.0,
      stock: {
        id: 2,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 2800.0,
        lastUpdated: new Date().toISOString(),
        sector: 'Technology',
        exchange: 'NASDAQ',
      },
    },
  ],
};

describe('PortfoliosController', () => {
  let app: INestApplication;
  let portfolioService: PortfolioService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PortfoliosController],
      providers: [
        {
          provide: PortfolioService,
          useValue: {
            getPortfolioByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    portfolioService = moduleRef.get(PortfolioService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /portfolios/:userId returns 200 and portfolio data for valid userId', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockResolvedValueOnce(mockPortfolio as any);
    const res = await request.default(app.getHttpServer()).get('/portfolios/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject(mockPortfolio);
  });

  it('GET /portfolios/:userId returns 404 if portfolio not found', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockRejectedValueOnce(new NotFoundException());
    const res = await request.default(app.getHttpServer()).get('/portfolios/999');
    expect(res.status).toBe(404);
  });

  it('GET /portfolios/:userId returns 400 for invalid userId (non-integer)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/abc');
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId returns 400 for invalid userId (zero)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/0');
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId returns 400 for invalid userId (negative)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/-5');
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId/stocks returns 200 and stocks array for valid userId', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockResolvedValueOnce(mockPortfolioWithHoldings as any);
    const res = await request.default(app.getHttpServer()).get('/portfolios/1/stocks');
    expect(res.status).toBe(200);
    expect(res.body.data.stocks).toBeInstanceOf(Array);
    expect(res.body.data.stocks.length).toBe(2);
    expect(res.body.data.stocks[0]).toMatchObject({
      quantity: 10,
      averagePurchasePrice: 100.5,
      stock: expect.objectContaining({ symbol: 'AAPL' }),
    });
  });

  it('GET /portfolios/:userId/stocks returns 404 if portfolio not found', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockRejectedValueOnce(new NotFoundException());
    const res = await request.default(app.getHttpServer()).get('/portfolios/999/stocks');
    expect(res.status).toBe(404);
  });

  it('GET /portfolios/:userId/stocks returns 400 for invalid userId (non-integer)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/abc/stocks');
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId/stocks returns 400 for invalid userId (zero)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/0/stocks');
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId/stocks returns 400 for invalid userId (negative)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/-5/stocks');
    expect(res.status).toBe(400);
  });
});
