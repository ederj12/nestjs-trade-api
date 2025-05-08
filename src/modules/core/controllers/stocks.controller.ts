import {
  Controller,
  Get,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Post,
  Body,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { GetStockParamDto } from '../dto/get-stock-param.dto';
import { GetStocksQueryDto } from '../dto/get-stocks-query.dto';
import { StockPurchaseRequestDto } from '../dto/stock-purchase-request.dto';
import { StockPurchaseResponseDto } from '../dto/stock-purchase-response.dto';
import { TransactionInterceptor } from '../interceptors/transaction.interceptor';
import { StockCacheService } from '../services';
import { TransactionService } from '../services/transaction.service';

/**
 * Controller for stock listing endpoints.
 */
@Controller('stocks')
export class StocksController {
  constructor(
    private readonly stockCacheService: StockCacheService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * GET /stocks/stats - Get cache statistics
   */
  @Get('stats')
  getCacheStats() {
    return this.stockCacheService.getStats();
  }
  /**
   * GET /stocks - List all stocks with pagination
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getStocks(@Query() query: GetStocksQueryDto) {
    // Get all stocks from cache
    const allStocks = Array.from(this.stockCacheService['cache'].values());
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

  /**
   * POST /stocks/purchase - Purchase stock (create transaction)
   */
  @Post('purchase')
  @UseInterceptors(TransactionInterceptor)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async purchaseStock(
    @Body() dto: StockPurchaseRequestDto,
    @Req() req: Request,
  ): Promise<StockPurchaseResponseDto> {
    return this.transactionService.processStockPurchase(dto, req.queryRunner!);
  }
}
