import { Controller, Get } from '@nestjs/common';

import { StockCacheService } from '../stocks/services';

/**
 * Controller to expose cache statistics endpoints.
 */
@Controller('stats')
export class StatsController {
  constructor(private readonly stockCacheService: StockCacheService) {}

  /**
   * Get cache statistics (hit/miss rate, size, etc.)
   */
  @Get('cache')
  getCacheStats() {
    return this.stockCacheService.getStats();
  }
}
