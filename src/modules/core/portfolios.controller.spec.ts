import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { PortfolioService } from './services/portfolio.service';
import { PortfoliosController } from './portfolios.controller';

const mockPortfolio = {
  id: 1,
  name: 'Test Portfolio',
  userId: 1,
  holdings: [],
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
});
