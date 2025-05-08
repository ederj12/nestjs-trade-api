import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

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
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsUUID()
  userId!: string;

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

export class GetPortfolioResponseDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsUUID()
  userId!: string;

  @ValidateNested({ each: true })
  holdings!: any[];

  @ValidateNested({ each: true })
  transactions!: any[];
}
