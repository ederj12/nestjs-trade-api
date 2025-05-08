import { VendorApiService } from '@modules/shared/vendor/vendor-api.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { StockRepository } from '../repositories/stock.repository';
import { StockCacheService } from '../services';

import type {
  VendorStockApiResponse,
  VendorStockItem,
} from '@modules/shared/vendor/vendor-stock.type';

/**
 * Background job to update stock prices from vendor API every 5 minutes.
 */
@Injectable()
export class StockUpdateJob {
  private readonly logger = new Logger(StockUpdateJob.name);
  isRunning = false;

  constructor(
    private readonly stockCacheService: StockCacheService,
    private readonly vendorApiService: VendorApiService,
    private readonly stockRepository: StockRepository,
  ) {}

  /**
   * Scheduled job to fetch and cache latest stock prices.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStockUpdate(): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Stock update job already running, skipping');
      return;
    }
    this.isRunning = true;
    this.logger.log('Stock update job started');
    try {
      const response: VendorStockApiResponse =
        await this.vendorApiService.fetchAllStockListingsWithPagination();

      const dbPromises = response.data.items.map((item: VendorStockItem) =>
        this.stockRepository.save({
          symbol: item.symbol,
          price: item.price,
          lastUpdated: item.lastUpdated,
          name: item.name,
          sector: item.sector,
          change: item.change,
        }),
      );

      const stocks = await Promise.all(dbPromises);

      for (const stock of stocks) {
        this.stockCacheService.setStock(stock.symbol, stock);
      }
      this.logger.log(`Stock update job completed: ${stocks.length} stocks updated`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Stock update job failed', error.stack || error.message);
      } else {
        this.logger.error('Stock update job failed', JSON.stringify(error));
      }
    } finally {
      this.isRunning = false;
    }
  }
}
