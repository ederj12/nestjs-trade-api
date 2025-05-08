import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class GetStockParamDto {
  @ApiProperty({
    example: 'AAPL',
    description: 'Stock symbol (1-10 uppercase letters, numbers, dot or dash)',
  })
  @IsString({ message: 'Symbol must be a string.' })
  @IsNotEmpty({ message: 'Symbol is required.' })
  @Matches(/^[A-Z0-9.-]{1,10}$/, {
    message: 'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
  })
  symbol!: string;
}
