import { Module } from '@nestjs/common';

import { StocksModule } from '../stocks/stocks.module';

import { StatsController } from './stats.controller';

@Module({
  imports: [StocksModule],
  controllers: [StatsController],
})
export class StatsModule {}
