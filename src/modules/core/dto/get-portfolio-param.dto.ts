import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPortfolioParamDto {
  @ApiProperty({ example: 'uuid-user', description: 'User ID' })
  @IsUUID('4', { message: 'User ID must be a valid UUID.' })
  userId!: string;
}
