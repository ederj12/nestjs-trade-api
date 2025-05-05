import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GetPortfolioParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;
}
