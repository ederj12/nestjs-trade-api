import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ReportSchedulerService } from '../jobs/report-scheduler.job';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportSchedulerService: ReportSchedulerService) {}

  /**
   * This endpoint is for manual report generation and is excluded from Swagger documentation.
   */
  @Post('generate')
  async triggerReport(@Body() body: { date: string }) {
    const date = new Date(body.date);
    if (isNaN(date.getTime())) {
      return { success: false, message: 'Invalid date format' };
    }
    try {
      await this.reportSchedulerService.triggerManualReport(date);
      return { success: true, message: 'Report generation triggered' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * This endpoint is for manual testing of the daily report logic and is excluded from Swagger documentation.
   */
  @Post('test-daily')
  async testDailyReport() {
    try {
      await this.reportSchedulerService.handleDailyReport();
      return { success: true, message: 'Scheduled daily report logic executed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
