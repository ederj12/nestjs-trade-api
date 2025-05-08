import { Controller, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { GetPortfolioParamDto } from '../dto/get-portfolio-param.dto';
import { PortfolioResponseDto, PortfolioStockResponseDto } from '../dto/get-portfolio-response.dto';
import { PortfolioService } from '../services/portfolio.service';

@ApiTags('portfolios')
@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get portfolio by user ID' })
  @ApiParam({ name: 'userId', type: String, example: 'uuid-user', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Portfolio details', type: PortfolioResponseDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPortfolioByUserId(@Param() params: GetPortfolioParamDto) {
    const portfolio = await this.portfolioService.getPortfolioByUserId(params.userId);
    return {
      data: portfolio,
    };
  }

  @Get(':userId/stocks')
  @ApiOperation({ summary: 'Get portfolio stocks by user ID' })
  @ApiParam({ name: 'userId', type: String, example: 'uuid-user', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Portfolio stocks', type: PortfolioStockResponseDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPortfolioStocksByUserId(@Param() params: GetPortfolioParamDto) {
    const portfolio = await this.portfolioService.getPortfolioByUserId(params.userId);
    return { data: portfolio.holdings };
  }
}
