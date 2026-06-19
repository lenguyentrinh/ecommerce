import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendOtpEmail(to: string, code: string, expiresAt: Date) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'Email verification code',
      text: `Your email verification code is ${code}. It will expire in 5 minutes.`,
      html: `
        <p>Your email verification code is <b>${code}</b>.</p>
        <p>It will expire in 5 minutes (${expiresAt.toISOString()}).</p>
      `,
    });
  }
}
