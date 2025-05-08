import { DataSource, EntityManager } from 'typeorm';

import { ReportEntity, ReportEmailDeliveryStatus } from '../entities/report.entity';
import { ReportRepository } from '../repositories/report.repository';

import { EmailDeliveryService } from './email-delivery.service';
import { ReportAggregationService } from './report-aggregation.service';
import { ReportFormattingService } from './report-formatting.service';
import { ReportGenerationService } from './report-generation.service';

describe('ReportGenerationService', () => {
  let service: ReportGenerationService;
  let aggregationService: jest.Mocked<ReportAggregationService>;
  let formattingService: jest.Mocked<ReportFormattingService>;
  let reportRepository: jest.Mocked<ReportRepository>;
  let dataSource: jest.Mocked<DataSource>;
  let emailDeliveryService: jest.Mocked<EmailDeliveryService>;
  let manager: jest.Mocked<EntityManager>;
  let reportEntity: ReportEntity;

  beforeEach(() => {
    aggregationService = { aggregateByDateRange: jest.fn() } as any;
    formattingService = { formatAsHtml: jest.fn() } as any;
    reportRepository = {} as any;
    emailDeliveryService = { sendMail: jest.fn() } as any;
    manager = {
      create: jest.fn(),
      save: jest.fn(),
    } as any;
    dataSource = {
      transaction: jest.fn(),
    } as any;
    dataSource.transaction.mockImplementation(async (...args: any[]) => {
      const fn = args[args.length - 1];
      return fn(manager);
    });
    service = new ReportGenerationService(
      aggregationService,
      formattingService,
      reportRepository,
      dataSource,
      emailDeliveryService,
    );
    reportEntity = new ReportEntity();
    reportEntity.reportDate = new Date('2024-01-01T00:00:00Z');
    reportEntity.reportType = 'DAILY';
    reportEntity.status = 'IN_PROGRESS';
    reportEntity.emailDeliveryStatus = ReportEmailDeliveryStatus.PENDING;
  });

  it('should generate and email report successfully', async () => {
    // Arrange
    const aggregation = {
      totalTransactions: 1,
      successfulTransactions: 1,
      failedTransactions: 0,
      transactionVolume: 100,
      averageTransactionValue: 100,
      byType: { BUY: 1 },
      byHour: { '2024-01-01T10': 1 },
    };
    aggregationService.aggregateByDateRange.mockResolvedValue(aggregation);
    formattingService.formatAsHtml.mockReturnValue('<html>Report</html>');
    manager.create.mockReturnValue(reportEntity as any);
    manager.save.mockResolvedValue(reportEntity);
    emailDeliveryService.sendMail.mockResolvedValue();

    // Act
    await service.generateReportForDate(new Date('2024-01-01T00:00:00Z'));

    // Assert
    expect(manager.create).toHaveBeenCalled();
    expect(aggregationService.aggregateByDateRange).toHaveBeenCalled();
    expect(formattingService.formatAsHtml).toHaveBeenCalledWith(aggregation);
    expect(emailDeliveryService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('2024-01-01'),
        html: '<html>Report</html>',
      }),
    );
    expect(reportEntity.emailDeliveryStatus).toBe(ReportEmailDeliveryStatus.SENT);
  });

  it('should set emailDeliveryStatus to FAILED if email sending fails', async () => {
    const aggregation = {
      totalTransactions: 1,
      successfulTransactions: 1,
      failedTransactions: 0,
      transactionVolume: 100,
      averageTransactionValue: 100,
      byType: { BUY: 1 },
      byHour: { '2024-01-01T10': 1 },
    };
    aggregationService.aggregateByDateRange.mockResolvedValue(aggregation);
    formattingService.formatAsHtml.mockReturnValue('<html>Report</html>');
    manager.create.mockReturnValue(reportEntity as any);
    manager.save.mockResolvedValue(reportEntity);
    emailDeliveryService.sendMail.mockRejectedValue(new Error('SMTP error'));

    await service.generateReportForDate(new Date('2024-01-01T00:00:00Z'));
    expect(reportEntity.emailDeliveryStatus).toBe(ReportEmailDeliveryStatus.FAILED);
  });

  it('should throw and not send email if lock cannot be acquired', async () => {
    manager.create.mockImplementation(() => {
      throw new Error('Duplicate lock');
    });
    await expect(service.generateReportForDate(new Date('2024-01-01T00:00:00Z'))).rejects.toThrow(
      'Duplicate lock',
    );
    expect(emailDeliveryService.sendMail).not.toHaveBeenCalled();
  });

  it('should throw and set status to FAILED if aggregation fails', async () => {
    manager.create.mockReturnValue(reportEntity as any);
    manager.save.mockResolvedValue(reportEntity);
    aggregationService.aggregateByDateRange.mockRejectedValue(new Error('DB error'));
    const spy = jest.spyOn<any, any>(service as any, 'updateReportStatus');
    await expect(service.generateReportForDate(new Date('2024-01-01T00:00:00Z'))).rejects.toThrow(
      'DB error',
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][2]).toBe('FAILED');
  });

  it('should throw and set status to FAILED if formatting fails', async () => {
    manager.create.mockReturnValue(reportEntity as any);
    manager.save.mockResolvedValue(reportEntity);
    aggregationService.aggregateByDateRange.mockResolvedValue({} as any);
    formattingService.formatAsHtml.mockImplementation(() => {
      throw new Error('Format error');
    });
    const spy = jest.spyOn<any, any>(service as any, 'updateReportStatus');
    await expect(service.generateReportForDate(new Date('2024-01-01T00:00:00Z'))).rejects.toThrow(
      'Format error',
    );
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][2]).toBe('FAILED');
  });
});
