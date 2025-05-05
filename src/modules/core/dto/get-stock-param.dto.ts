import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class GetStockParamDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9.-]{1,10}$/, {
    message: 'Symbol must be 1-10 characters, uppercase letters, numbers, dot or dash only.',
  })
  symbol!: string;
}
