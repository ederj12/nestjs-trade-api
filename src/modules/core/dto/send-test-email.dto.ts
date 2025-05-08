import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTestEmailDto {
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  html: string;

  @IsString()
  @IsOptional()
  text?: string;
}
