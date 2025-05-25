import { registerAs } from '@nestjs/config';
import dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { PortfolioHolding } from '../modules/core/entities/portfolio-holding.entity';
import { Portfolio } from '../modules/core/entities/portfolio.entity';
import { ReportEntity } from '../modules/core/entities/report.entity';
import { Stock } from '../modules/core/entities/stock.entity';
import { Transaction } from '../modules/core/entities/transaction.entity';
import { User } from '../modules/core/entities/user.entity';

dotenv.config();

const typeOrmConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nestjs_trade_app',
  entities: [User, Portfolio, PortfolioHolding, Stock, Transaction, ReportEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export default registerAs('typeorm', () => typeOrmConfig);

export const dataSource = new DataSource(typeOrmConfig as DataSourceOptions);
