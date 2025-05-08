import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({ example: 'test@example.com', description: 'Recipient email address' })
  @IsEmail({}, { message: 'Must be a valid email address.' })
  @IsNotEmpty({ message: 'Recipient email is required.' })
  to: string;

  @ApiProperty({ example: 'Test Subject', description: 'Email subject' })
  @IsString({ message: 'Subject must be a string.' })
  @IsNotEmpty({ message: 'Subject is required.' })
  subject: string;

  @ApiProperty({ example: '<b>Hello</b>', description: 'HTML content of the email' })
  @IsString({ message: 'HTML content must be a string.' })
  @IsNotEmpty({ message: 'HTML content is required.' })
  html: string;

  @ApiProperty({
    example: 'Hello',
    description: 'Plain text content of the email (optional)',
    required: false,
  })
  @IsString({ message: 'Text content must be a string.' })
  @IsOptional()
  text?: string;
}
