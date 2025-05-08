import { Injectable } from '@nestjs/common';
import { ReportAggregationResultDto } from './report-aggregation.service';

@Injectable()
export class ReportFormattingService {
  formatAsHtml(data: ReportAggregationResultDto, locale: string = 'en-US'): string {
    const nf = new Intl.NumberFormat(locale);
    const percent = (num: number, denom: number) =>
      denom === 0 ? 'N/A' : `${((num / denom) * 100).toFixed(1)}%`;
    const successRate = percent(data.successfulTransactions, data.totalTransactions);
    const barLength = 20;
    const filled =
      data.totalTransactions === 0
        ? 0
        : Math.round((data.successfulTransactions / data.totalTransactions) * barLength);
    const bar = `<span style=\"display:inline-block;width:${barLength * 6}px;background:#eee;border-radius:4px;overflow:hidden;vertical-align:middle;\"><span style=\"display:inline-block;width:${filled * 6}px;height:12px;background:#4caf50;\"></span></span>`;

    // By Type Table
    const byTypeRows = Object.entries(data.byType ?? {}).length
      ? Object.entries(data.byType)
          .map(
            ([type, count]) =>
              `<tr><td style=\"padding:4px 8px;border:1px solid #ddd;\">${type}</td><td style=\"padding:4px 8px;border:1px solid #ddd;text-align:right;\">${nf.format(count)}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="2" style="padding:4px 8px;text-align:center;color:#888;">No data</td></tr>';

    // By Hour Table
    const byHourRows = Object.entries(data.byHour ?? {}).length
      ? Object.entries(data.byHour)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(
            ([hour, count]) =>
              `<tr><td style=\"padding:4px 8px;border:1px solid #ddd;\">${hour}</td><td style=\"padding:4px 8px;border:1px solid #ddd;text-align:right;\">${nf.format(count)}</td></tr>`,
          )
          .join('')
      : '<tr><td colspan="2" style="padding:4px 8px;text-align:center;color:#888;">No data</td></tr>';

    return `
      <html>
        <body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:0;margin:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px #0001;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px 32px;">
                <h1 style="margin:0 0 16px 0;font-size:1.8em;color:#222;">Daily Transaction Report</h1>
                <table style="width:100%;margin-bottom:24px;">
                  <tr><td style="color:#666;padding:4px 0;">Total Transactions:</td><td style="text-align:right;font-weight:bold;">${nf.format(data.totalTransactions)}</td></tr>
                  <tr><td style="color:#666;padding:4px 0;">Successful:</td><td style="text-align:right;">${nf.format(data.successfulTransactions)}</td></tr>
                  <tr><td style="color:#666;padding:4px 0;">Failed:</td><td style="text-align:right;">${nf.format(data.failedTransactions)}</td></tr>
                  <tr><td style="color:#666;padding:4px 0;">Volume:</td><td style="text-align:right;">${nf.format(data.transactionVolume)}</td></tr>
                  <tr><td style="color:#666;padding:4px 0;">Average Value:</td><td style="text-align:right;">${nf.format(data.averageTransactionValue)}</td></tr>
                  <tr><td style="color:#666;padding:4px 0;">Success Rate:</td><td style="text-align:right;">${successRate} ${bar}</td></tr>
                </table>
                <h2 style="font-size:1.2em;margin:24px 0 8px 0;color:#333;">Transactions by Type</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                  <tr style="background:#f3f3f3;"><th style="padding:6px 8px;text-align:left;border:1px solid #ddd;">Type</th><th style="padding:6px 8px;text-align:right;border:1px solid #ddd;">Count</th></tr>
                  ${byTypeRows}
                </table>
                <h2 style="font-size:1.2em;margin:24px 0 8px 0;color:#333;">Transactions by Hour</h2>
                <table style="width:100%;border-collapse:collapse;">
                  <tr style="background:#f3f3f3;"><th style="padding:6px 8px;text-align:left;border:1px solid #ddd;">Hour</th><th style="padding:6px 8px;text-align:right;border:1px solid #ddd;">Count</th></tr>
                  ${byHourRows}
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  formatAsText(data: ReportAggregationResultDto): string {
    // TODO: Add localization for dates/currency
    return [
      'Daily Transaction Report',
      `Total Transactions: ${data.totalTransactions}`,
      `Successful: ${data.successfulTransactions}`,
      `Failed: ${data.failedTransactions}`,
      `Volume: ${data.transactionVolume}`,
      `Average Value: ${data.averageTransactionValue}`,
      // TODO: Add byType and byHour summaries
    ].join('\n');
  }

  formatAsCsv(data: ReportAggregationResultDto): string {
    // TODO: Add CSV headers and rows for all fields
    const rows = [
      ['Metric', 'Value'],
      ['Total Transactions', data.totalTransactions],
      ['Successful', data.successfulTransactions],
      ['Failed', data.failedTransactions],
      ['Volume', data.transactionVolume],
      ['Average Value', data.averageTransactionValue],
      // TODO: Add byType and byHour as additional rows
    ];
    return rows.map(row => row.join(',')).join('\n');
  }

  // TODO: Add visualization helpers (e.g., for success rates, volume trends)
  // TODO: Add localization helpers for dates/currency
}
