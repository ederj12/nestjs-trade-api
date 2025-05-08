import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

import { ReportGenerationService } from '../services/report-generation.service';

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);
  private readonly scheduleTime: string;
  private successCount = 0;
  private failureCount = 0;

  constructor(
    private readonly reportGenerationService: ReportGenerationService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Read schedule time from environment variable or default to 2am UTC
    this.scheduleTime = process.env.REPORT_SCHEDULE_TIME || '0 2 * * *';
  }

  // Helper for retry logic
  private async withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelay = 500): Promise<T> {
    let attempt = 0;
    let lastError: any;
    while (attempt < maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        attempt++;
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
    throw lastError;
  }

  // DRY: Core report generation logic with metrics, retry, and logging
  private async executeReportGeneration(date: Date, context: string): Promise<void> {
    this.logger.log(`${context} report generation started for ${date.toISOString()}`);
    const startTime = Date.now();
    try {
      await this.withRetry(() => this.reportGenerationService.generateReportForDate(date));
      this.successCount++;
      const duration = Date.now() - startTime;
      this.logger.log(
        `${context} report generation completed in ${duration}ms (successes: ${this.successCount}, failures: ${this.failureCount})`,
      );
    } catch (error) {
      if (error.message === 'Report already in progress or exists') {
        this.logger.warn('Skipped: Report already in progress or exists');
      } else {
        this.failureCount++;
        const duration = Date.now() - startTime;
        this.logger.error(
          `Error during ${context.toLowerCase()} report generation after retries (failures: ${this.failureCount}, duration: ${duration}ms)`,
          error.stack,
        );
      }
    }
  }

  // Scheduled task for daily report generation
  @Cron(process.env.REPORT_SCHEDULE_TIME || CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyReport() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await this.executeReportGeneration(today, 'Scheduled daily');
  }

  // Manual trigger for on-demand report generation
  async triggerManualReport(date: Date): Promise<void> {
    await this.executeReportGeneration(date, 'Manual');
  }
}
