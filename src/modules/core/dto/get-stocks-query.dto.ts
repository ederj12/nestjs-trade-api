import { Type } from 'class-transformer';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetStocksQueryDto {
  @ApiProperty({ example: 1, description: 'Page number (min 1)' })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer.' })
  @Min(1, { message: 'Page must be at least 1.' })
  @IsOptional()
  page: number = 1;

  @ApiProperty({ example: 20, description: 'Page size (min 1, max 100)' })
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer.' })
  @Min(1, { message: 'Limit must be at least 1.' })
  @Max(100, { message: 'Limit must be at most 100.' })
  @IsOptional()
  limit: number = 20;
}
