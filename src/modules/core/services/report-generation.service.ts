import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryFailedError, EntityManager } from 'typeorm';

import { ReportEntity, ReportEmailDeliveryStatus } from '../entities/report.entity';
import { ReportRepository } from '../repositories/report.repository';

import { EmailDeliveryService, EmailPayload } from './email-delivery.service';
import { ReportAggregationService } from './report-aggregation.service';
import { ReportFormattingService } from './report-formatting.service';

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);

  constructor(
    private readonly aggregationService: ReportAggregationService,
    private readonly formattingService: ReportFormattingService,
    private readonly reportRepository: ReportRepository,
    private readonly dataSource: DataSource,
    private readonly emailDeliveryService: EmailDeliveryService,
  ) {}

  private async acquireReportLock(
    manager: EntityManager,
    start: Date,
    reportType: string,
  ): Promise<ReportEntity> {
    try {
      const reportEntity = manager.create(ReportEntity, {
        reportDate: start,
        reportType,
        status: 'IN_PROGRESS',
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        reportData: {},
        emailDeliveryStatus: ReportEmailDeliveryStatus.PENDING,
      });
      await manager.save(reportEntity);
      this.logger.log('Acquired report lock (row inserted)');
      return reportEntity;
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === '23505') {
        this.logger.warn('Report for this date is already being generated or exists. Skipping.');
        throw new Error('Report already in progress or exists');
      }
      this.logger.error('Failed to acquire report lock', err);
      throw err;
    }
  }

  private async updateReportStatus(
    manager: EntityManager,
    reportEntity: ReportEntity,
    status: string,
    aggregation?: any,
    htmlReport?: string,
  ): Promise<void> {
    reportEntity.status = status;
    if (aggregation) {
      reportEntity.totalTransactions = aggregation.totalTransactions;
      reportEntity.successfulTransactions = aggregation.successfulTransactions;
      reportEntity.failedTransactions = aggregation.failedTransactions;
      reportEntity.reportData = {
        ...aggregation,
        htmlReport,
      };
    }
    await manager.save(reportEntity);
    this.logger.log(`Report status updated to ${status}`);
  }

  async generateReportForDate(date: Date): Promise<void> {
    this.logger.log(`Starting report generation for date: ${date.toISOString()}`);
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 1);
    const reportType = 'DAILY';
    let reportEntity: ReportEntity | undefined;

    await this.dataSource.transaction(async manager => {
      // 1. Acquire lock
      reportEntity = await this.acquireReportLock(manager, start, reportType);
      try {
        // 2. Aggregate data
        this.logger.log(
          `Aggregating transactions from ${start.toISOString()} to ${end.toISOString()}`,
        );
        const aggregation = await this.aggregationService.aggregateByDateRange(start, end);

        // 3. Format report (HTML as example)
        const htmlReport = this.formattingService.formatAsHtml(aggregation);
        this.logger.log('Formatted report as HTML');

        // 4. Update report entity with aggregation and formatted output, set status COMPLETED
        await this.updateReportStatus(manager, reportEntity, 'COMPLETED', aggregation, htmlReport);
        this.logger.log('Report saved to database');

        // 5. Send report via email
        try {
          const payload: EmailPayload = {
            subject: `Daily Transaction Report - ${start.toISOString().slice(0, 10)}`,
            html: htmlReport,
            text: undefined, // Optionally add text version
          };
          await this.emailDeliveryService.sendMail(payload);
          reportEntity.emailDeliveryStatus = ReportEmailDeliveryStatus.SENT;
          await manager.save(reportEntity);
          this.logger.log('Report email sent successfully');
        } catch (emailError) {
          reportEntity.emailDeliveryStatus = ReportEmailDeliveryStatus.FAILED;
          await manager.save(reportEntity);
          this.logger.error('Failed to send report email', emailError);
        }
      } catch (error) {
        this.logger.error('Error during report generation', error);
        if (reportEntity) {
          await this.updateReportStatus(manager, reportEntity, 'FAILED');
        }
        throw error;
      }
    });
    this.logger.log('Report generation complete');
  }
}
