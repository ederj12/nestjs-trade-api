import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';

import { PortfolioHolding } from './portfolio-holding.entity';
import { Transaction } from './transaction.entity';

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

  @OneToMany(() => Transaction, (transaction: Transaction) => transaction.stock)
  transactions!: Transaction[];

  @OneToMany(() => PortfolioHolding, (holding: PortfolioHolding) => holding.stock)
  holdings!: PortfolioHolding[];
}
