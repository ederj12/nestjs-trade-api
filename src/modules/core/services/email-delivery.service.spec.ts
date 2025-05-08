import { EmailDeliveryService, EmailPayload } from './email-delivery.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const createTransportMock = nodemailer.createTransport as jest.Mock;

describe('EmailDeliveryService', () => {
  let service: EmailDeliveryService;
  let sendMailMock: jest.Mock;
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'password';
    process.env.REPORT_RECIPIENTS = 'a@example.com,b@example.com';
    process.env.SMTP_FROM = 'reports@example.com';
    sendMailMock = jest.fn();
    createTransportMock.mockReturnValue({ sendMail: sendMailMock } as any);
    service = new EmailDeliveryService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it('should send email successfully to default recipients', async () => {
    sendMailMock.mockResolvedValue({ messageId: '123' });
    const payload: EmailPayload = {
      subject: 'Test Subject',
      html: '<b>Hello</b>',
      text: 'Hello',
    };
    await expect(service.sendMail(payload)).resolves.toBeUndefined();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'reports@example.com',
        to: 'a@example.com,b@example.com',
        subject: 'Test Subject',
        html: '<b>Hello</b>',
        text: 'Hello',
      }),
    );
  });

  it('should send email to custom recipients', async () => {
    sendMailMock.mockResolvedValue({ messageId: '456' });
    const payload: EmailPayload = {
      subject: 'Custom',
      html: '<b>Hi</b>',
      to: ['custom@example.com'],
    };
    await expect(service.sendMail(payload)).resolves.toBeUndefined();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'custom@example.com',
      }),
    );
  });

  it('should throw if no recipients are specified', async () => {
    process.env.REPORT_RECIPIENTS = '';
    service = new EmailDeliveryService();
    const payload: EmailPayload = {
      subject: 'No Recipients',
      html: '<b>Hi</b>',
    };
    await expect(service.sendMail(payload)).rejects.toThrow('No recipients specified');
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('should handle SMTP failure and log error', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP error'));
    const payload: EmailPayload = {
      subject: 'Fail',
      html: '<b>Fail</b>',
    };
    await expect(service.sendMail(payload)).rejects.toThrow('SMTP error');
    expect(sendMailMock).toHaveBeenCalled();
  });

  it('should handle empty subject and body', async () => {
    sendMailMock.mockResolvedValue({ messageId: '789' });
    const payload: EmailPayload = {
      subject: '',
      html: '',
    };
    await expect(service.sendMail(payload)).resolves.toBeUndefined();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '',
        html: '',
      }),
    );
  });
});
