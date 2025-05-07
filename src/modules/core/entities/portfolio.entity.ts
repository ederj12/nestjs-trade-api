import { Entity, Column, OneToMany, ManyToOne, Index, Relation } from 'typeorm';

import type { PortfolioHolding } from './portfolio-holding.entity';
import type { Transaction } from './transaction.entity';
import type { User } from './user.entity';

import { BaseEntity } from '@/modules/shared/database/entities/base.entity';

@Entity('portfolios')
export class Portfolio extends BaseEntity {
  @Column()
  name!: string;

  @ManyToOne('User', 'portfolios')
  user!: Relation<User>;

  @Index('IDX_portfolio_userId')
  @Column()
  userId!: string;

  @OneToMany('Transaction', 'portfolio')
  transactions!: Relation<Transaction[]>;

  @OneToMany('PortfolioHolding', 'portfolio')
  holdings!: Relation<PortfolioHolding[]>;
}
