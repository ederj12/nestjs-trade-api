import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockRepository } from './repositories/stock.repository';
import { VendorModule } from '@modules/shared/vendor/vendor.module';
import { StockCacheService } from './services';
import { StockUpdateJob } from './jobs';
import { ScheduleModule } from '@nestjs/schedule';
import { StocksController } from './stocks.controller';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Stock]), VendorModule],
  controllers: [StocksController],
  providers: [StockCacheService, StockRepository, StockUpdateJob],
  exports: [StockCacheService, StockRepository],
})
export class StocksModule {}
