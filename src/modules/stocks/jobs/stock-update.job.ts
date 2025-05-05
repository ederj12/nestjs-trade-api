import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockCacheService } from '../services';
import { VendorApiService } from '@modules/shared/vendor/vendor-api.service';
import { CachedStockData } from '../models/cached-stock-data.type';
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

  constructor(
    private readonly stockCacheService: StockCacheService,
    private readonly vendorApiService: VendorApiService,
  ) {}

  /**
   * Scheduled job to fetch and cache latest stock prices.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStockUpdate(): Promise<void> {
    this.logger.log('Stock update job started');
    try {
      const response: VendorStockApiResponse =
        await this.vendorApiService.fetchAllStockListingsWithPagination();
      const stocks: CachedStockData[] = response.data.items.map((item: VendorStockItem) => ({
        symbol: item.symbol,
        price: item.price,
        // Vendor API does not provide currency, so we assume USD
        currency: 'USD',
        timestamp: new Date(item.lastUpdated),
        name: item.name,
        sector: item.sector,
        change: item.change,
      }));
      stocks.forEach(stock => {
        this.stockCacheService.setStock(stock.symbol, stock);
      });
      this.logger.log(`Stock update job completed: ${stocks.length} stocks updated`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Stock update job failed', error.stack || error.message);
      } else {
        this.logger.error('Stock update job failed', JSON.stringify(error));
      }
    }
  }
}
