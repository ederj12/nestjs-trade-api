import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, Check } from 'typeorm';
import { Stock } from '../../stocks/entities/stock.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
@Entity('transactions')
@Index('IDX_transaction_user_stock', ['userId', 'stockId'])
@Index('IDX_transaction_timestamp', ['timestamp'])
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user: User) => user.transactions)
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Stock, (stock: Stock) => stock.transactions, { eager: true })
  stock!: Stock;

  @Column()
  stockId!: number;

  @ManyToOne(() => Portfolio, (portfolio: Portfolio) => portfolio.transactions)
  portfolio!: Portfolio;

  @Column()
  portfolioId!: number;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  price!: number;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;
}
