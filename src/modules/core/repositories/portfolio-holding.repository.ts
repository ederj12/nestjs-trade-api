import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { PortfolioHolding } from '../entities/portfolio-holding.entity';

@Injectable()
export class PortfolioHoldingRepository extends Repository<PortfolioHolding> {
  constructor(private dataSource: DataSource) {
    super(PortfolioHolding, dataSource.createEntityManager());
  }

  async findByPortfolio(portfolioId: number) {
    return this.find({
      where: { portfolio: { id: portfolioId } },
      relations: ['stock'],
    });
  }
}
