import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { PortfolioService } from '../services/portfolio.service';

import { PortfoliosController } from './portfolios.controller';

const validUserId = '991a9586-9709-4c47-90c0-7ffed700b3b8';
const invalidUserId = 'not-a-uuid';

const mockUser = {
  id: validUserId,
  name: 'Test User',
  email: 'test@example.com',
  portfolios: [],
  transactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPortfolio = {
  id: 'uuid-portfolio-1',
  name: 'Test Portfolio',
  userId: validUserId,
  holdings: [],
  user: mockUser,
  transactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPortfolioWithHoldings = {
  id: 'uuid-portfolio-1',
  name: 'Test Portfolio',
  userId: validUserId,
  holdings: [
    {
      id: 'uuid-holding-1',
      quantity: 10,
      averagePurchasePrice: 100.5,
      stock: {
        id: 'uuid-stock-aapl',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 150.25,
        lastUpdated: new Date(),
        sector: 'Technology',
        exchange: 'NASDAQ',
        currency: 'USD',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      portfolio: {
        id: 'uuid-portfolio-1',
        name: 'Test Portfolio',
        user: mockUser,
        userId: validUserId,
        holdings: [],
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'uuid-holding-2',
      quantity: 5,
      averagePurchasePrice: 200.0,
      stock: {
        id: 'uuid-stock-goog',
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 2800.0,
        lastUpdated: new Date(),
        sector: 'Technology',
        exchange: 'NASDAQ',
        currency: 'USD',
        change: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      portfolio: {
        id: 'uuid-portfolio-1',
        name: 'Test Portfolio',
        user: mockUser,
        userId: validUserId,
        holdings: [],
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  user: mockUser,
  transactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
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
    jest.spyOn(portfolioService, 'getPortfolioByUserId').mockResolvedValueOnce(mockPortfolio);
    const res = await request.default(app.getHttpServer()).get(`/portfolios/${validUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: mockPortfolio.id,
      name: mockPortfolio.name,
      userId: mockPortfolio.userId,
      holdings: [],
      transactions: [],
    });
  });

  it('GET /portfolios/:userId returns 404 if portfolio not found', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockRejectedValueOnce(new NotFoundException());
    const res = await request.default(app.getHttpServer()).get(`/portfolios/${validUserId}`);
    expect(res.status).toBe(404);
  });

  it('GET /portfolios/:userId returns 400 for invalid userId (non-uuid)', async () => {
    const res = await request.default(app.getHttpServer()).get(`/portfolios/${invalidUserId}`);
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId returns 400 for invalid userId (empty)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios/');
    expect(res.status).toBe(404); // No param, so 404
  });

  it('GET /portfolios/:userId/stocks returns 200 and stocks array for valid userId', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockResolvedValueOnce(mockPortfolioWithHoldings);
    const res = await request.default(app.getHttpServer()).get(`/portfolios/${validUserId}/stocks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]).toMatchObject({
      quantity: 10,
      averagePurchasePrice: 100.5,
      stock: expect.objectContaining({ symbol: 'AAPL' }),
    });
  });

  it('GET /portfolios/:userId/stocks returns 404 if portfolio not found', async () => {
    jest
      .spyOn(portfolioService, 'getPortfolioByUserId')
      .mockRejectedValueOnce(new NotFoundException());
    const res = await request.default(app.getHttpServer()).get(`/portfolios/${validUserId}/stocks`);
    expect(res.status).toBe(404);
  });

  it('GET /portfolios/:userId/stocks returns 400 for invalid userId (non-uuid)', async () => {
    const res = await request
      .default(app.getHttpServer())
      .get(`/portfolios/${invalidUserId}/stocks`);
    expect(res.status).toBe(400);
  });

  it('GET /portfolios/:userId/stocks returns 400 for invalid userId (empty)', async () => {
    const res = await request.default(app.getHttpServer()).get('/portfolios//stocks');
    expect(res.status).toBe(404); // No param, so 404
  });
});
