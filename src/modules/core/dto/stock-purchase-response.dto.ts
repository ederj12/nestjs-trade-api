import { IsUUID, IsString, IsOptional } from 'class-validator';

export class StockPurchaseResponseDto {
  @IsUUID()
  transactionId!: string;

  @IsString()
  status!: string;

  @IsString()
  message!: string;

  @IsString()
  @IsOptional()
  createdAt?: string;
}
