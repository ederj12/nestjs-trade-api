import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockRepository } from './repositories/stock.repository';
import { VendorModule } from '@modules/shared/vendor/vendor.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stock]), VendorModule],
  controllers: [],
  providers: [StockRepository],
  exports: [StockRepository],
})
export class StocksModule {}
