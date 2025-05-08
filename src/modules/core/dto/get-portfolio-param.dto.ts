import { IsUUID } from 'class-validator';

export class GetPortfolioParamDto {
  @IsUUID()
  userId!: string;
}
