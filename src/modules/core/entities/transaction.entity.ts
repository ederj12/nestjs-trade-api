import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, Relation } from 'typeorm';

import { Portfolio } from './portfolio.entity';
import { Stock } from './stock.entity';
import { User } from './user.entity';

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

  @ManyToOne(() => User, (user: User) => undefined)
  user!: Relation<User>;

  @Column()
  userId!: number;

  @ManyToOne(() => Stock, (stock: Stock) => undefined, { eager: true })
  stock!: Relation<Stock>;

  @Column()
  stockId!: number;

  @ManyToOne(() => Portfolio, (portfolio: Portfolio) => undefined)
  portfolio!: Relation<Portfolio>;

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
