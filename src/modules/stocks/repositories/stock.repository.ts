import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Stock } from '../entities/stock.entity';

@Injectable()
export class StockRepository extends Repository<Stock> {
  constructor(private dataSource: DataSource) {
    super(Stock, dataSource.createEntityManager());
  }

  async findBySymbol(symbol: string): Promise<Stock | null> {
    return this.findOne({ where: { symbol } });
  }
}
