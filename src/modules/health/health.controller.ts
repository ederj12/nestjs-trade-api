import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private typeOrm: TypeOrmHealthIndicator,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    try {
      return this.health.check([
        async () => this.typeOrm.pingCheck('database', { connection: this.dataSource }),
      ]);
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message || 'Database connection failed',
      };
    }
  }
}
