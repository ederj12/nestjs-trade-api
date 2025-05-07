import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
  Relation,
} from 'typeorm';

import type { Portfolio } from './portfolio.entity';
import type { Transaction } from './transaction.entity';

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

  @OneToMany('Portfolio', 'user')
  portfolios!: Relation<Portfolio[]>;

  @OneToMany('Transaction', 'user')
  transactions!: Relation<Transaction[]>;
}
