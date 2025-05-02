import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

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
  portfolios!: Portfolio[];

  @OneToMany(() => Transaction, (transaction: Transaction) => transaction.user)
  transactions!: Transaction[];
}
