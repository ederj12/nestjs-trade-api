import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortfolioHolding } from './entities/portfolio-holding.entity';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioService } from './portfolio.service';
import { PortfoliosController } from './portfolios.controller';
import { PortfolioHoldingRepository } from './repositories/portfolio-holding.repository';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { User } from '@/modules/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, PortfolioHolding, User])],
  providers: [PortfolioService, PortfolioRepository, PortfolioHoldingRepository],
  exports: [PortfolioService],
  controllers: [PortfoliosController],
})
export class PortfoliosModule {}
