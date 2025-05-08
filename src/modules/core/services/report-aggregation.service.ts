import { Injectable } from '@nestjs/common';
import { Between } from 'typeorm';

import { TransactionStatus } from '../entities/transaction.entity';
import { TransactionRepository } from '../repositories/transaction.repository';

export interface ReportAggregationResultDto {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  transactionVolume: number;
  averageTransactionValue: number;
  byType: Record<string, number>;
  byHour: Record<string, number>;
  // TODO: Add payment method grouping if available
}

@Injectable()
export class ReportAggregationService {
  private cache: Map<string, ReportAggregationResultDto> = new Map();

  constructor(private readonly transactionRepository: TransactionRepository) {}

  async aggregateByDateRange(start: Date, end: Date): Promise<ReportAggregationResultDto> {
    // In-memory cache key
    const cacheKey = `${start.toISOString()}_${end.toISOString()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const transactions = await this.transactionRepository.find({
      where: {
        timestamp: Between(start, end),
      },
    });

    // Edge case: no transactions
    if (transactions.length === 0) {
      const emptyResult: ReportAggregationResultDto = {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        transactionVolume: 0,
        averageTransactionValue: 0,
        byType: {},
        byHour: {},
      };
      this.cache.set(cacheKey, emptyResult);
      return emptyResult;
    }

    // Aggregation logic
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(
      t => t.status === TransactionStatus.COMPLETED,
    ).length;
    const failedTransactions = transactions.filter(
      t => t.status === TransactionStatus.FAILED,
    ).length;
    const transactionVolume = transactions.reduce(
      (sum, t) => sum + Number(t.price) * t.quantity,
      0,
    );
    const averageTransactionValue =
      totalTransactions > 0 ? transactionVolume / totalTransactions : 0;

    // Group by type
    const byType: Record<string, number> = {};
    for (const t of transactions) {
      const type = t.type || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;
    }

    // Group by hour (format: YYYY-MM-DDTHH)
    const byHour: Record<string, number> = {};
    for (const t of transactions) {
      const hour = t.timestamp
        ? t.timestamp.toISOString().slice(0, 13) // e.g., '2024-05-13T15'
        : 'UNKNOWN';
      byHour[hour] = (byHour[hour] || 0) + 1;
    }

    const result: ReportAggregationResultDto = {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      transactionVolume,
      averageTransactionValue,
      byType,
      byHour,
    };
    this.cache.set(cacheKey, result);
    return result;
  }
}
