import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsUUID, IsString } from 'class-validator';

export class StockPurchaseResponseDto {
  @ApiProperty({ example: 'uuid-transaction', description: 'Transaction ID' })
  @IsUUID('4', { message: 'Transaction ID must be a valid UUID.' })
  @Expose()
  transactionId!: string;

  @ApiProperty({ example: 'SUCCESS', description: 'Transaction status' })
  @IsString({ message: 'Status must be a string.' })
  @Expose()
  status!: string;

  @ApiProperty({ example: 'Stock purchase successful', description: 'Status message' })
  @IsString({ message: 'Message must be a string.' })
  @Expose()
  message!: string;

  @ApiProperty({ example: '2024-05-01T12:00:00Z', description: 'Transaction timestamp' })
  @IsString({ message: 'Timestamp must be a string.' })
  @Exclude()
  createdAt!: string;
}
