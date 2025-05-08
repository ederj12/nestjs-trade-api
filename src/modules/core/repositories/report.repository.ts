import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';

import { ReportEntity } from '../entities/report.entity';

@Injectable()
export class ReportRepository extends Repository<ReportEntity> {
  constructor(private dataSource: DataSource) {
    super(ReportEntity, dataSource.createEntityManager());
  }

  async findReportsByDateRange(
    reportType: string,
    start: Date,
    end: Date,
  ): Promise<ReportEntity[]> {
    return this.find({
      where: {
        reportType,
        reportDate: Between(start, end),
      },
      order: { reportDate: 'DESC' },
    });
  }
}
