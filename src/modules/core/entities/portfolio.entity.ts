import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Index,
  Relation,
} from 'typeorm';

import type { PortfolioHolding } from './portfolio-holding.entity';
import type { Transaction } from './transaction.entity';
import type { User } from './user.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne('User', 'portfolios')
  user!: Relation<User>;

  @Index('IDX_portfolio_userId')
  @Column()
  userId!: number;

  @OneToMany('Transaction', 'portfolio')
  transactions!: Relation<Transaction[]>;

  @OneToMany('PortfolioHolding', 'portfolio')
  holdings!: Relation<PortfolioHolding[]>;
}
