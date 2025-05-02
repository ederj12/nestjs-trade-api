import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './entities/stock.entity';
import { StockRepository } from './repositories/stock.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Stock])],
  controllers: [],
  providers: [StockRepository],
  exports: [StockRepository],
})
export class StocksModule {}
