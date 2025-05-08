import { Entity, Column, ManyToOne, Unique, Relation } from 'typeorm';

import type { Portfolio } from './portfolio.entity';
import type { Stock } from './stock.entity';

import { BaseEntity } from '@/modules/shared/database/entities/base.entity';

@Entity('portfolio_holdings')
@Unique(['portfolio', 'stock'])
export class PortfolioHolding extends BaseEntity {
  @ManyToOne('Portfolio', 'holdings')
  portfolio!: Relation<Portfolio>;

  @ManyToOne('Stock', 'holdings')
  stock!: Relation<Stock>;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  averagePurchasePrice!: number;
}
