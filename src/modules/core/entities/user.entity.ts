import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
  Relation,
} from 'typeorm';

import { Portfolio } from './portfolio.entity';
import { Transaction } from './transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Index('IDX_user_email')
  @Column({ unique: true })
  email!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Portfolio, (portfolio: Portfolio) => portfolio.user)
  portfolios!: Relation<Portfolio[]>;

  @OneToMany(() => Transaction, (transaction: Transaction) => transaction.user)
  transactions!: Relation<Transaction[]>;
}
