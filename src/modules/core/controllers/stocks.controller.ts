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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
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
@ApiTags('stocks')
@Controller('stocks')
export class StocksController {
  constructor(
    private readonly stockCacheService: StockCacheService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * GET /stocks/stats - Get cache statistics
   * (Not included in Swagger docs as it's for internal/monitoring use)
   */
  @Get('stats')
  getCacheStats() {
    return this.stockCacheService.getStats();
  }

  /**
   * GET /stocks - List all stocks with pagination
   */
  @Get()
  @ApiOperation({ summary: 'List all stocks with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'List of stocks',
    schema: {
      example: {
        data: [{ symbol: 'AAPL', name: 'Apple Inc.', price: 170.5 }],
        meta: { total: 1, page: 1, limit: 20 },
      },
    },
  })
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
  @ApiOperation({ summary: 'Get single stock details by symbol' })
  @ApiParam({ name: 'symbol', type: String, example: 'AAPL', description: 'Stock symbol' })
  @ApiResponse({
    status: 200,
    description: 'Stock details',
    schema: { example: { data: { symbol: 'AAPL', name: 'Apple Inc.', price: 170.5 } } },
  })
  @ApiResponse({ status: 404, description: 'Stock not found' })
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
  @ApiOperation({ summary: 'Purchase stock (create transaction)' })
  @ApiBody({ type: StockPurchaseRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Stock purchase response',
    type: StockPurchaseResponseDto,
  })
  @UseInterceptors(TransactionInterceptor)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async purchaseStock(
    @Body() dto: StockPurchaseRequestDto,
    @Req() req: Request,
  ): Promise<StockPurchaseResponseDto> {
    return this.transactionService.processStockPurchase(dto, req.queryRunner!);
  }
}
