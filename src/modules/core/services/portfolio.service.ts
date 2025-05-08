import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { PortfolioHolding } from '../entities/portfolio-holding.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { PortfolioHoldingRepository } from '../repositories/portfolio-holding.repository';
import { PortfolioRepository } from '../repositories/portfolio.repository';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly portfolioHoldingRepository: PortfolioHoldingRepository,
  ) {}

  async createPortfolio(portfolio: Portfolio): Promise<Portfolio> {
    if (!portfolio.userId) {
      throw new Error('userId is required');
    }
    // Transaction: create portfolio and holdings atomically
    return this.dataSource.transaction(async manager => {
      const portfolioRepo = manager.getRepository(Portfolio);
      const holdingRepo = manager.getRepository(PortfolioHolding);
      // Check if portfolio already exists for user
      const existing = await portfolioRepo.findOne({ where: { userId: portfolio.userId } });
      if (existing) {
        throw new Error('Portfolio already exists for this user');
      }
      // Save portfolio
      const saved = await portfolioRepo.save(portfolio);
      // Optionally, save holdings if provided
      if (portfolio.holdings && portfolio.holdings.length > 0) {
        for (const holding of portfolio.holdings) {
          holding.portfolio = saved;
          await holdingRepo.save(holding);
        }
      }
      return saved;
    });
  }

  async getPortfolioByUserId(userId: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { userId },
      relations: ['holdings', 'holdings.stock'],
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio not found for user: ${userId}`);
    }
    return portfolio;
  }
}
