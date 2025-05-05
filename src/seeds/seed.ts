import dataSource from '../config/typeorm.config';
import { PortfolioHolding } from '../modules/core/entities/portfolio-holding.entity';
import { Portfolio } from '../modules/core/entities/portfolio.entity';
import { Stock } from '../modules/core/entities/stock.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../modules/core/entities/transaction.entity';
import { User } from '../modules/core/entities/user.entity';

async function seed() {
  await dataSource.initialize();

  // Clear existing data
  await dataSource.manager.delete(Transaction, {});
  await dataSource.manager.delete(PortfolioHolding, {});
  await dataSource.manager.delete(Portfolio, {});
  await dataSource.manager.delete(Stock, {});
  await dataSource.manager.delete(User, {});

  // Seed Users
  const user1 = dataSource.manager.create(User, { name: 'Alice', email: 'alice@example.com' });
  const user2 = dataSource.manager.create(User, { name: 'Bob', email: 'bob@example.com' });
  await dataSource.manager.save([user1, user2]);

  // Seed Stocks
  const stock1 = dataSource.manager.create(Stock, {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 180.25,
    sector: 'Technology',
    exchange: 'NASDAQ',
  });
  const stock2 = dataSource.manager.create(Stock, {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 720.5,
    sector: 'Automotive',
    exchange: 'NASDAQ',
  });
  await dataSource.manager.save([stock1, stock2]);

  // Seed Portfolios
  const portfolio1 = dataSource.manager.create(Portfolio, {
    name: 'Alice Portfolio',
    user: user1,
    userId: user1.id,
  });
  const portfolio2 = dataSource.manager.create(Portfolio, {
    name: 'Bob Portfolio',
    user: user2,
    userId: user2.id,
  });
  await dataSource.manager.save([portfolio1, portfolio2]);

  // Seed PortfolioHoldings
  const holding1 = dataSource.manager.create(PortfolioHolding, {
    portfolio: portfolio1,
    stock: stock1,
    quantity: 10,
    averagePurchasePrice: 175.0,
  });
  const holding2 = dataSource.manager.create(PortfolioHolding, {
    portfolio: portfolio2,
    stock: stock2,
    quantity: 5,
    averagePurchasePrice: 700.0,
  });
  await dataSource.manager.save([holding1, holding2]);

  // Seed Transactions
  const tx1 = dataSource.manager.create(Transaction, {
    user: user1,
    userId: user1.id,
    stock: stock1,
    stockId: stock1.id,
    portfolio: portfolio1,
    portfolioId: portfolio1.id,
    quantity: 10,
    price: 175.0,
    type: TransactionType.BUY,
    status: TransactionStatus.COMPLETED,
  });
  const tx2 = dataSource.manager.create(Transaction, {
    user: user2,
    userId: user2.id,
    stock: stock2,
    stockId: stock2.id,
    portfolio: portfolio2,
    portfolioId: portfolio2.id,
    quantity: 5,
    price: 700.0,
    type: TransactionType.BUY,
    status: TransactionStatus.COMPLETED,
  });
  await dataSource.manager.save([tx1, tx2]);

  console.log('Database seeded successfully!');
  await dataSource.destroy();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
