import { Type, Expose, Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'uuid-holding', description: 'Holding ID' })
  @IsUUID('4', { message: 'Holding ID must be a valid UUID.' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 10, description: 'Quantity of stock held' })
  @IsInt({ message: 'Quantity must be an integer.' })
  @Expose()
  quantity!: number;

  @ApiProperty({ example: 150.25, description: 'Average purchase price' })
  @IsNumber({}, { message: 'Average purchase price must be a number.' })
  @Expose()
  averagePurchasePrice!: number;

  @ApiProperty({
    example: {
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 170.5,
      lastUpdated: '2024-05-01T12:00:00Z',
      sector: 'Technology',
      exchange: 'NASDAQ',
    },
    description: 'Stock details',
  })
  @IsObject({ message: 'Stock must be an object.' })
  @Expose()
  stock!: {
    id: number;
    symbol: string;
    name: string;
    price: number;
    lastUpdated?: Date;
    sector?: string;
    exchange?: string;
  };

  @ApiProperty({ example: '2024-05-01T12:00:00Z', description: 'Holding creation timestamp' })
  @Exclude()
  createdAt!: Date;

  @ApiProperty({ example: '2024-05-02T12:00:00Z', description: 'Holding last update timestamp' })
  @Exclude()
  updatedAt!: Date;

  @ApiProperty({ example: null, description: 'Holding deletion timestamp (nullable)' })
  @Exclude()
  deletedAt?: Date;
}

export class PortfolioResponseDto {
  @ApiProperty({ example: 'uuid-portfolio', description: 'Portfolio ID' })
  @IsUUID('4', { message: 'Portfolio ID must be a valid UUID.' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Growth Portfolio', description: 'Portfolio name' })
  @IsString({ message: 'Portfolio name must be a string.' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'uuid-user', description: 'User ID' })
  @IsUUID('4', { message: 'User ID must be a valid UUID.' })
  @Expose()
  userId!: string;

  @ApiProperty({ type: [PortfolioHoldingStockDto], description: 'Portfolio holdings' })
  @IsArray({ message: 'Holdings must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => PortfolioHoldingStockDto)
  @Expose()
  holdings!: PortfolioHoldingStockDto[];

  @ApiProperty({ example: '2024-05-01T12:00:00Z', description: 'Portfolio creation timestamp' })
  @Exclude()
  createdAt!: Date;

  @ApiProperty({ example: '2024-05-02T12:00:00Z', description: 'Portfolio last update timestamp' })
  @Exclude()
  updatedAt!: Date;

  @ApiProperty({ example: null, description: 'Portfolio deletion timestamp (nullable)' })
  @Exclude()
  deletedAt?: Date;
}

export class PortfolioStockResponseDto {
  @ApiProperty({ type: [PortfolioHoldingStockDto], description: 'Stocks in the portfolio' })
  @IsArray({ message: 'Stocks must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => PortfolioHoldingStockDto)
  @Expose()
  stocks!: PortfolioHoldingStockDto[];
}

export class GetPortfolioResponseDto {
  @ApiProperty({ example: 'uuid-portfolio', description: 'Portfolio ID' })
  @IsUUID('4', { message: 'Portfolio ID must be a valid UUID.' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Growth Portfolio', description: 'Portfolio name' })
  @IsString({ message: 'Portfolio name must be a string.' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'uuid-user', description: 'User ID' })
  @IsUUID('4', { message: 'User ID must be a valid UUID.' })
  @Expose()
  userId!: string;

  @ApiProperty({ type: [PortfolioHoldingStockDto], description: 'Portfolio holdings' })
  @ValidateNested({ each: true })
  @Expose()
  holdings!: any[];

  @ApiProperty({ type: 'array', description: 'Portfolio transactions' })
  @ValidateNested({ each: true })
  @Expose()
  transactions!: any[];

  @ApiProperty({ example: '2024-05-01T12:00:00Z', description: 'Portfolio creation timestamp' })
  @Exclude()
  createdAt!: Date;

  @ApiProperty({ example: '2024-05-02T12:00:00Z', description: 'Portfolio last update timestamp' })
  @Exclude()
  updatedAt!: Date;

  @ApiProperty({ example: null, description: 'Portfolio deletion timestamp (nullable)' })
  @Exclude()
  deletedAt?: Date;
}
