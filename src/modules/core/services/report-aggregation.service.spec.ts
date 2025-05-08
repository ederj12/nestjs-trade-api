import { TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { TransactionRepository } from '../repositories/transaction.repository';

import { ReportAggregationService } from './report-aggregation.service';

describe('ReportAggregationService', () => {
  let service: ReportAggregationService;
  let transactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    transactionRepository = {
      find: jest.fn(),
    } as any;
    service = new ReportAggregationService(transactionRepository);
  });

  it('should return all zeros when there are no transactions', async () => {
    transactionRepository.find.mockResolvedValue([]);
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-02T00:00:00Z');
    const result = await service.aggregateByDateRange(start, end);
    expect(result).toEqual({
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      transactionVolume: 0,
      averageTransactionValue: 0,
      byType: {},
      byHour: {},
    });
  });

  it('should aggregate transactions correctly', async () => {
    const transactions = [
      {
        status: TransactionStatus.COMPLETED,
        type: TransactionType.BUY,
        price: 100,
        quantity: 2,
        timestamp: new Date('2024-01-01T10:15:00Z'),
      },
      {
        status: TransactionStatus.FAILED,
        type: TransactionType.SELL,
        price: 200,
        quantity: 1,
        timestamp: new Date('2024-01-01T11:00:00Z'),
      },
      {
        status: TransactionStatus.COMPLETED,
        type: TransactionType.BUY,
        price: 150,
        quantity: 1,
        timestamp: new Date('2024-01-01T10:45:00Z'),
      },
    ];
    transactionRepository.find.mockResolvedValue(transactions as any);
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-02T00:00:00Z');
    const result = await service.aggregateByDateRange(start, end);
    expect(result.totalTransactions).toBe(3);
    expect(result.successfulTransactions).toBe(2);
    expect(result.failedTransactions).toBe(1);
    expect(result.transactionVolume).toBe(100 * 2 + 200 * 1 + 150 * 1);
    expect(result.averageTransactionValue).toBeCloseTo((100 * 2 + 200 * 1 + 150 * 1) / 3);
    expect(result.byType).toEqual({ BUY: 2, SELL: 1 });
    expect(result.byHour).toEqual({
      '2024-01-01T10': 2,
      '2024-01-01T11': 1,
    });
  });

  it('should handle only failed transactions', async () => {
    const transactions = [
      {
        status: TransactionStatus.FAILED,
        type: TransactionType.SELL,
        price: 50,
        quantity: 1,
        timestamp: new Date('2024-01-01T12:00:00Z'),
      },
    ];
    transactionRepository.find.mockResolvedValue(transactions as any);
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-02T00:00:00Z');
    const result = await service.aggregateByDateRange(start, end);
    expect(result.totalTransactions).toBe(1);
    expect(result.successfulTransactions).toBe(0);
    expect(result.failedTransactions).toBe(1);
    expect(result.transactionVolume).toBe(50);
    expect(result.averageTransactionValue).toBe(50);
    expect(result.byType).toEqual({ SELL: 1 });
    expect(result.byHour).toEqual({ '2024-01-01T12': 1 });
  });

  it('should use cache for repeated queries', async () => {
    const transactions = [
      {
        status: TransactionStatus.COMPLETED,
        type: TransactionType.BUY,
        price: 100,
        quantity: 1,
        timestamp: new Date('2024-01-01T10:00:00Z'),
      },
    ];
    transactionRepository.find.mockResolvedValue(transactions as any);
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-02T00:00:00Z');
    const result1 = await service.aggregateByDateRange(start, end);
    // Change mock to ensure cache is used
    transactionRepository.find.mockResolvedValue([]);
    const result2 = await service.aggregateByDateRange(start, end);
    expect(result2).toEqual(result1);
  });
});
