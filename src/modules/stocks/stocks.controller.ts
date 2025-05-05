import {
  Controller,
  Get,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { GetStockParamDto } from './dto/get-stock-param.dto';
import { GetStocksQueryDto } from './dto/get-stocks-query.dto';
import { CachedStockData } from './models/cached-stock-data.type';
import { StockCacheService } from './services';

/**
 * Controller for stock listing endpoints.
 */
@Controller('stocks')
export class StocksController {
  constructor(private readonly stockCacheService: StockCacheService) {}

  /**
   * GET /stocks - List all stocks with pagination
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getStocks(@Query() query: GetStocksQueryDto) {
    // Get all stocks from cache
    const allStocks: CachedStockData[] = Array.from(this.stockCacheService['cache'].values());
    const total = allStocks.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = allStocks.slice(start, end);
    return {
      data: paginated,
      meta: { total, page, limit },
    };
  }

  /**
   * GET /stocks/:symbol - Get single stock details by symbol
   */
  @Get(':symbol')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getStockBySymbol(@Param() params: GetStockParamDto) {
    const stock = this.stockCacheService.getStock(params.symbol);
    if (!stock) {
      throw new HttpException(
        { statusCode: 404, message: 'Stock not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { data: stock };
  }
}
