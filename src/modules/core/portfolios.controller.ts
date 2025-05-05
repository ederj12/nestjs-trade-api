import { Controller, Get, Param, UsePipes, ValidationPipe } from '@nestjs/common';

import { GetPortfolioParamDto } from './dto/get-portfolio-param.dto';
import { PortfolioService } from './services/portfolio.service';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPortfolioByUserId(@Param() params: GetPortfolioParamDto) {
    const portfolio = await this.portfolioService.getPortfolioByUserId(params.userId);
    return { data: portfolio };
  }
}
