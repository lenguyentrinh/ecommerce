import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import SignupDto from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import LoginDto from './dto/login.dto';
import { randomUUID } from 'crypto';
import ForgotPasswordDto from './dto/forgot-password.dto';
import { QueryFailedError } from 'typeorm';
import VerifyEmailDto from './dto/verify-email.dto';
import { MailService } from '../mail/mail.service';
import SendOtpDto from './dto/send-otp.dto';
import VerifyOtpDto from './dto/verify-otp.dto';
import ResetPasswordDto from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(dto: SignupDto) {
    try {
      const password = await bcrypt.hash(dto.password, 10);
      const user = await this.userService.create({ ...dto, password });
      const code = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // await this.userService.setEmailOTP(user.id, code, expiresAt);
      // await this.sendEmailOtp(user.email, code, expiresAt);
      return {
        message: 'Signup successful, OTP sent to your email.',
        email: user.email,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const msg = (error as any).message || '';
        if (
          msg.includes('duplicate') ||
          msg.includes('unique') ||
          (error as any).code === '23505' ||
          (error as any).code === 'ER_DUP_ENTRY'
        ) {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified)
      throw new UnauthorizedException('Email not verified');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) throw new UnauthorizedException('Invalid email');

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await this.userService.updateResetToken(user.id, token, expiresAt);
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmailOtp(email: string, code: string, expiresAt: Date) {
    return this.mailService.sendOtpEmail(email, code, expiresAt);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.userService.verifyEmailOtp(
      verifyEmailDto.email,
      verifyEmailDto.code,
    );
    if (!user) throw new UnauthorizedException('Invalid OTP');
    return {
      message: 'Email verified successfully',
      email: user.email,
    };
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const user = await this.userService.findByEmail(sendOtpDto.email);
    if (!user) throw new UnauthorizedException('Invalid email');
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await this.userService.setEmailOTP(user.id, code, expiresAt);
    await this.sendEmailOtp(user.email, code, expiresAt);
    return { message: 'OTP sent to your email', email: user.email };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.userService.verifyEmailOtp(
      verifyOtpDto.email,
      verifyOtpDto.otp,
    );
    if (!user) throw new UnauthorizedException('Invalid OTP');
    return { message: 'OTP verified successfully', email: user.email };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findByEmail(resetPasswordDto.email);
    if (!user) throw new UnauthorizedException('Invalid email');

    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmNewPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    const isSamePassword = await bcrypt.compare(
      resetPasswordDto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const newPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userService.updatePassword(user.id, newPassword);
    return { message: 'Password reset successfully', email: user.email };
  }
}
