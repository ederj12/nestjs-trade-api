import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { StockUpdateJob } from './modules/core/jobs/stock-update.job';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const stockUpdateJob = app.get(StockUpdateJob);
  stockUpdateJob.handleStockUpdate();
  const port = configService.get('PORT');
  await app.listen(port ?? 3000);
}
bootstrap();
