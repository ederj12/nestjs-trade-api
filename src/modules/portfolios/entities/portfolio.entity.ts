import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Index } from 'typeorm';

import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';

import { PortfolioHolding } from './portfolio-holding.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => User, (user: User) => user.portfolios)
  user!: User;

  @Index('IDX_portfolio_userId')
  @Column()
  userId!: number;

  @OneToMany(() => Transaction, (transaction: Transaction) => transaction.portfolio)
  transactions!: Transaction[];

  @OneToMany(() => PortfolioHolding, (holding: PortfolioHolding) => holding.portfolio)
  holdings!: PortfolioHolding[];
}
