import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetPortfolioParamDto {
  @ApiProperty({ example: 'uuid-user', description: 'User ID' })
  @IsUUID('4', { message: 'User ID must be a valid UUID.' })
  userId!: string;
}
