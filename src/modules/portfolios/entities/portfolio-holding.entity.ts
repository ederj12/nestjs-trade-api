import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';

import { Stock } from '../../stocks/entities/stock.entity';

import { Portfolio } from './portfolio.entity';

@Entity('portfolio_holdings')
@Unique(['portfolio', 'stock'])
export class PortfolioHolding {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Portfolio, (portfolio: Portfolio) => portfolio.holdings)
  portfolio!: Portfolio;

  @ManyToOne(() => Stock, (stock: Stock) => stock.holdings)
  stock!: Stock;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  averagePurchasePrice!: number;
}
