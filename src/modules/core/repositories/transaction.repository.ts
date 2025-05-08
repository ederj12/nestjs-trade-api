import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionRepository extends Repository<Transaction> {
  constructor(private dataSource: DataSource) {
    super(Transaction, dataSource.createEntityManager());
  }

  async getTransactionHistory(userId: string, limit = 20, offset = 0) {
    return this.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['stock', 'portfolio'],
    });
  }
}
