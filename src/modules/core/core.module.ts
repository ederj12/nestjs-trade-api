import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortfoliosController } from './controllers/portfolios.controller';
import { ReportsController } from './controllers/reports.controller';
import { PortfolioHolding } from './entities/portfolio-holding.entity';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioHoldingRepository } from './repositories/portfolio-holding.repository';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { ReportRepository } from './repositories/report.repository';
import { PortfolioService } from './services/portfolio.service';
import { ReportAggregationService } from './services/report-aggregation.service';
import { ReportFormattingService } from './services/report-formatting.service';
import { ReportGenerationService } from './services/report-generation.service';

import { EmailTestController } from '@/modules/core/controllers/email-test.controller';
import { StocksController } from '@/modules/core/controllers/stocks.controller';
import { ReportEntity } from '@/modules/core/entities/report.entity';
import { Stock } from '@/modules/core/entities/stock.entity';
import { Transaction } from '@/modules/core/entities/transaction.entity';
import { User } from '@/modules/core/entities/user.entity';
import { ReportSchedulerService } from '@/modules/core/jobs/report-scheduler.job';
import { StockUpdateJob } from '@/modules/core/jobs/stock-update.job';
import { TransactionRepository } from '@/modules/core/repositories';
import { StockRepository } from '@/modules/core/repositories/stock.repository';
import { UserRepository } from '@/modules/core/repositories/user.repository';
import { EmailDeliveryService } from '@/modules/core/services/email-delivery.service';
import { StockCacheService } from '@/modules/core/services/stock-cache.service';
import { TransactionService } from '@/modules/core/services/transaction.service';
import { VendorModule } from '@/modules/shared/vendor/vendor.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Portfolio, PortfolioHolding, User, Transaction, Stock, ReportEntity]),
    VendorModule,
  ],
  providers: [
    PortfolioService,
    PortfolioRepository,
    PortfolioHoldingRepository,
    StockCacheService,
    StockUpdateJob,
    TransactionService,
    UserRepository,
    StockRepository,
    ReportGenerationService,
    ReportFormattingService,
    ReportAggregationService,
    ReportRepository,
    TransactionRepository,
    ReportSchedulerService,
    EmailDeliveryService,
  ],
  exports: [PortfolioService, StockCacheService],
  controllers: [PortfoliosController, StocksController, ReportsController, EmailTestController],
})
export class CoreModule {}
