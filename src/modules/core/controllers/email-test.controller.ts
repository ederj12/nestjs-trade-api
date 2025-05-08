import { Body, Controller, Post } from '@nestjs/common';

import { SendTestEmailDto } from '../dto/send-test-email.dto';
import { EmailDeliveryService } from '../services/email-delivery.service';

/**
 * Controller for testing email delivery functionality.
 */
@Controller('email-test')
export class EmailTestController {
  constructor(private readonly emailDeliveryService: EmailDeliveryService) {}

  /**
   * Send a test email to the specified recipient.
   * @param dto SendTestEmailDto
   */
  @Post('send')
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    try {
      await this.emailDeliveryService.sendMail({
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
      });
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
