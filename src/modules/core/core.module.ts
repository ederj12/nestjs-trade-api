import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortfolioHolding } from './entities/portfolio-holding.entity';
import { Portfolio } from './entities/portfolio.entity';
import { PortfoliosController } from './portfolios.controller';
import { PortfolioHoldingRepository } from './repositories/portfolio-holding.repository';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { PortfolioService } from './services/portfolio.service';

import { Stock } from '@/modules/core/entities/stock.entity';
import { Transaction } from '@/modules/core/entities/transaction.entity';
import { User } from '@/modules/core/entities/user.entity';
import { StockUpdateJob } from '@/modules/core/jobs/stock-update.job';
import { StockCacheService } from '@/modules/core/services/stock-cache.service';
import { StocksController } from '@/modules/core/stocks.controller';
import { VendorModule } from '@/modules/shared/vendor/vendor.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Portfolio, PortfolioHolding, User, Transaction, Stock]),
    VendorModule,
  ],
  providers: [
    PortfolioService,
    PortfolioRepository,
    PortfolioHoldingRepository,
    StockCacheService,
    StockUpdateJob,
  ],
  exports: [PortfolioService, StockCacheService],
  controllers: [PortfoliosController, StocksController],
})
export class CoreModule {}
