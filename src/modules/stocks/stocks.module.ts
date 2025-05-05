import { VendorModule } from '@modules/shared/vendor/vendor.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Stock } from './entities/stock.entity';
import { StockUpdateJob } from './jobs';
import { StockRepository } from './repositories/stock.repository';
import { StockCacheService } from './services';
import { StocksController } from './stocks.controller';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Stock]), VendorModule],
  controllers: [StocksController],
  providers: [StockCacheService, StockRepository, StockUpdateJob],
  exports: [StockCacheService, StockRepository],
})
export class StocksModule {}
