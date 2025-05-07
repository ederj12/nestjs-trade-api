import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '@/modules/shared/database/entities/base.entity';

@Entity('stocks')
export class Stock extends BaseEntity {
  @Index('IDX_stock_symbol')
  @Column()
  symbol!: string;

  @Column()
  name!: string;

  @Column('decimal', { precision: 12, scale: 2 })
  price!: number;

  @Index('IDX_stock_last_updated')
  @Column({ type: 'timestamp', nullable: true })
  lastUpdated!: Date;

  @Column()
  sector!: string;

  @Column()
  currency!: string;

  @Column()
  change!: number;
}
