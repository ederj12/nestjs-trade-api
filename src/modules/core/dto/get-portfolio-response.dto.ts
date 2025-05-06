import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';

export class PortfolioHoldingStockDto {
  @IsInt()
  quantity!: number;

  @IsNumber()
  averagePurchasePrice!: number;

  @IsObject()
  stock!: {
    id: number;
    symbol: string;
    name: string;
    price: number;
    lastUpdated?: Date;
    sector?: string;
    exchange?: string;
  };
}

export class PortfolioResponseDto {
  @IsInt()
  id!: number;

  @IsString()
  name!: string;

  @IsInt()
  userId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioHoldingStockDto)
  holdings!: PortfolioHoldingStockDto[];
}

export class PortfolioStockResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioHoldingStockDto)
  stocks!: PortfolioHoldingStockDto[];
}
