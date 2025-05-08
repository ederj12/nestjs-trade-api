import { Body, Controller, Post } from '@nestjs/common';
import { ReportSchedulerService } from '../jobs/report-scheduler.job';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportSchedulerService: ReportSchedulerService) {}

  /**
   * Temporary endpoint to manually trigger report generation for a given date.
   * @param body { date: string (ISO) }
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
}
