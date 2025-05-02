import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioHolding } from './entities/portfolio-holding.entity';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { PortfolioHoldingRepository } from './repositories/portfolio-holding.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, PortfolioHolding])],
  providers: [PortfolioRepository, PortfolioHoldingRepository],
  exports: [PortfolioRepository, PortfolioHoldingRepository],
})
export class PortfoliosModule {}
