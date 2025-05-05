import { DataSource, DataSourceOptions } from 'typeorm';

import { PortfolioHolding } from '../modules/portfolios/entities/portfolio-holding.entity';
import { Portfolio } from '../modules/portfolios/entities/portfolio.entity';
import { Stock } from '../modules/stocks/entities/stock.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { User } from '../modules/users/entities/user.entity';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'fuse_finance',
  entities: [User, Portfolio, PortfolioHolding, Stock, Transaction],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export default new DataSource(typeOrmConfig);
