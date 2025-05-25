import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { StockUpdateJob } from './modules/core/jobs/stock-update.job';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const stockUpdateJob = app.get(StockUpdateJob);
  stockUpdateJob.handleStockUpdate();
  const port = configService.get('PORT');

  const config = new DocumentBuilder()
    .setTitle('Nestjs Trade API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port ?? 3000);
}
bootstrap();
