import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { Stock } from '../entities/stock.entity';

import { StockRepository } from './stock.repository';

describe('StockRepository', () => {
  let stockRepository: StockRepository;
  let saveMock: jest.Mock;

  beforeEach(async () => {
    saveMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockRepository,
        {
          provide: DataSource,
          useValue: {
            createEntityManager: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(StockRepository)
      .useValue({
        save: saveMock,
        findOne: jest.fn(),
      })
      .compile();

    stockRepository = module.get<StockRepository>(StockRepository);
  });

  it('should insert a new stock if it does not exist', async () => {
    const stockData: Partial<Stock> = {
      symbol: 'AAPL',
      price: 150,
      name: 'Apple Inc.',
    };
    saveMock.mockResolvedValueOnce({ ...stockData, id: 1 });
    const result = await stockRepository.save(stockData);
    expect(saveMock).toHaveBeenCalledWith(stockData);
    expect(result).toEqual({ ...stockData, id: 1 });
  });

  it('should update an existing stock if it exists', async () => {
    const stockData: Partial<Stock> = {
      symbol: 'AAPL',
      price: 155,
      name: 'Apple Inc.',
    };
    saveMock.mockResolvedValueOnce({ ...stockData, id: 1 });
    const result = await stockRepository.save(stockData);
    expect(saveMock).toHaveBeenCalledWith(stockData);
    expect(result).toEqual({ ...stockData, id: 1 });
  });
});
