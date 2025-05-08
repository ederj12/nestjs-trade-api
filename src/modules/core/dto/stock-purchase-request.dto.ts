import { Type } from 'class-transformer';
import { IsUUID, IsInt, IsPositive, IsNumber, Min, IsString } from 'class-validator';

export class StockPurchaseRequestDto {
  @IsUUID()
  userId!: string;

  @IsString()
  symbol!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;
}
