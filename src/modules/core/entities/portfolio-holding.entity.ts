import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, Relation } from 'typeorm';

import type { Portfolio } from './portfolio.entity';
import type { Stock } from './stock.entity';

@Entity('portfolio_holdings')
@Unique(['portfolio', 'stock'])
export class PortfolioHolding {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne('Portfolio', 'holdings')
  portfolio!: Relation<Portfolio>;

  @ManyToOne('Stock', 'holdings')
  stock!: Relation<Stock>;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  averagePurchasePrice!: number;
}
