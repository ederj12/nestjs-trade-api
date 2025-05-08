import { Entity, Column, Index } from 'typeorm';

import { BaseEntity } from '@/modules/shared/database/entities/base.entity';

export enum ReportEmailDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('reports')
@Index('IDX_report_reportDate', ['reportDate'], { unique: true })
@Index('IDX_report_status', ['status'])
export class ReportEntity extends BaseEntity {
  @Column({ type: 'date' })
  reportDate!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt!: Date;

  @Column({ type: 'varchar', length: 64 })
  reportType!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'int' })
  totalTransactions!: number;

  @Column({ type: 'int' })
  successfulTransactions!: number;

  @Column({ type: 'int' })
  failedTransactions!: number;

  @Column({ type: 'jsonb' })
  reportData!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 32 })
  emailDeliveryStatus!: ReportEmailDeliveryStatus;
}
