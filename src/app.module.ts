import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreModule } from './modules/core/core.module';
import { HealthModule } from './modules/health/health.module';
import vendorApiConfig from './modules/shared/vendor/vendor-api.config';

import typeOrmConfig from '@/config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig, vendorApiConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('typeorm.host'),
        port: config.get<number>('typeorm.port'),
        username: config.get<string>('typeorm.username'),
        password: config.get<string>('typeorm.password'),
        database: config.get<string>('typeorm.database'),
        autoLoadEntities: true,
        synchronize: true, // Set to false in production!
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    CoreModule,
  ],
})
export class AppModule {}
