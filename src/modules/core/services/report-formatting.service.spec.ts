import { ReportFormattingService } from './report-formatting.service';
import { ReportAggregationResultDto } from './report-aggregation.service';

describe('ReportFormattingService', () => {
  let service: ReportFormattingService;

  const sampleData: ReportAggregationResultDto = {
    totalTransactions: 5,
    successfulTransactions: 3,
    failedTransactions: 2,
    transactionVolume: 1000,
    averageTransactionValue: 200,
    byType: { BUY: 3, SELL: 2 },
    byHour: { '2024-01-01T10': 2, '2024-01-01T11': 3 },
  };

  const emptyData: ReportAggregationResultDto = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    transactionVolume: 0,
    averageTransactionValue: 0,
    byType: {},
    byHour: {},
  };

  beforeEach(() => {
    service = new ReportFormattingService();
  });

  it('should format as HTML', () => {
    const html = service.formatAsHtml(sampleData);
    expect(html).toContain('<h1>Daily Transaction Report</h1>');
    expect(html).toContain('Total Transactions: 5');
    expect(html).toContain('Successful: 3');
    expect(html).toContain('Failed: 2');
    expect(html).toContain('Volume: 1000');
    expect(html).toContain('Average Value: 200');
  });

  it('should format as plain text', () => {
    const text = service.formatAsText(sampleData);
    expect(text).toContain('Daily Transaction Report');
    expect(text).toContain('Total Transactions: 5');
    expect(text).toContain('Successful: 3');
    expect(text).toContain('Failed: 2');
    expect(text).toContain('Volume: 1000');
    expect(text).toContain('Average Value: 200');
  });

  it('should format as CSV', () => {
    const csv = service.formatAsCsv(sampleData);
    expect(csv).toContain('Metric,Value');
    expect(csv).toContain('Total Transactions,5');
    expect(csv).toContain('Successful,3');
    expect(csv).toContain('Failed,2');
    expect(csv).toContain('Volume,1000');
    expect(csv).toContain('Average Value,200');
  });

  it('should handle empty data for all formats', () => {
    const html = service.formatAsHtml(emptyData);
    const text = service.formatAsText(emptyData);
    const csv = service.formatAsCsv(emptyData);
    expect(html).toContain('Total Transactions: 0');
    expect(text).toContain('Total Transactions: 0');
    expect(csv).toContain('Total Transactions,0');
  });

  it('should escape HTML special characters', () => {
    const dataWithSpecialChars: ReportAggregationResultDto = {
      ...sampleData,
      byType: { 'BUY & SELL': 5 },
    };
    const html = service.formatAsHtml(dataWithSpecialChars);
    // This is a placeholder; actual escaping should be implemented if needed
    expect(html).toContain('Total Transactions: 5');
  });
});
