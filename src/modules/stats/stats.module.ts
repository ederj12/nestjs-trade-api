import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [StocksModule],
  controllers: [StatsController],
})
export class StatsModule {}
