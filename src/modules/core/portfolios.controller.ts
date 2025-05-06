import { Controller, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { GetPortfolioParamDto } from './dto/get-portfolio-param.dto';
import { PortfolioResponseDto, PortfolioStockResponseDto } from './dto/get-portfolio-response.dto';
import { PortfolioService } from './services/portfolio.service';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPortfolioByUserId(@Param() params: GetPortfolioParamDto) {
    const portfolio = await this.portfolioService.getPortfolioByUserId(params.userId);
    const dto = plainToInstance(PortfolioResponseDto, {
      id: portfolio.id,
      name: portfolio.name,
      userId: portfolio.userId,
      holdings: (portfolio.holdings || []).map(holding => ({
        quantity: holding.quantity,
        averagePurchasePrice: holding.averagePurchasePrice,
        stock: holding.stock,
      })),
    });
    return { data: dto };
  }

  @Get(':userId/stocks')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPortfolioStocksByUserId(@Param() params: GetPortfolioParamDto) {
    const portfolio = await this.portfolioService.getPortfolioByUserId(params.userId);
    const stocks = (portfolio.holdings || []).map(holding => ({
      quantity: holding.quantity,
      averagePurchasePrice: holding.averagePurchasePrice,
      stock: holding.stock,
    }));
    const dto = plainToInstance(PortfolioStockResponseDto, { stocks });
    return { data: dto };
  }
}
