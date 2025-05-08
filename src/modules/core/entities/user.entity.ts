import { Entity, Column, OneToMany, Index, Relation } from 'typeorm';

import type { Portfolio } from './portfolio.entity';
import type { Transaction } from './transaction.entity';

import { BaseEntity } from '@/modules/shared/database/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name!: string;

  @Index('IDX_user_email')
  @Column({ unique: true })
  email!: string;

  @OneToMany('Portfolio', 'user')
  portfolios!: Relation<Portfolio[]>;

  @OneToMany('Transaction', 'user')
  transactions!: Relation<Transaction[]>;
}
