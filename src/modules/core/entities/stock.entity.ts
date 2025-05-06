import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, Relation } from 'typeorm';

import type { PortfolioHolding } from './portfolio-holding.entity';
import type { Transaction } from './transaction.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('IDX_stock_symbol')
  @Column({ unique: true })
  symbol!: string;

  @Column()
  name!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  price!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated?: Date;

  @Column({ nullable: true })
  sector?: string;

  @Column({ nullable: true })
  exchange?: string;

  @OneToMany('Transaction', 'stock')
  transactions!: Relation<Transaction[]>;

  @OneToMany('PortfolioHolding', 'stock')
  holdings!: Relation<PortfolioHolding[]>;
}
