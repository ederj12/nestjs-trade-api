import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsUUID, IsInt, IsPositive, IsNumber, IsString } from 'class-validator';

export class StockPurchaseRequestDto {
  @ApiProperty({ example: 'uuid-user', description: 'User ID' })
  @IsUUID('4', { message: 'User ID must be a valid UUID.' })
  userId!: string;

  @ApiProperty({ example: 'AAPL', description: 'Stock symbol' })
  @IsString({ message: 'Symbol must be a string.' })
  symbol!: string;

  @ApiProperty({ example: 5, description: 'Quantity to purchase (must be positive integer)' })
  @IsInt({ message: 'Quantity must be an integer.' })
  @IsPositive({ message: 'Quantity must be positive.' })
  quantity!: number;

  @ApiProperty({ example: 150.25, description: 'Purchase price per stock' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number.' })
  @IsPositive({ message: 'Price must be greater than 0.' })
  price!: number;
}
