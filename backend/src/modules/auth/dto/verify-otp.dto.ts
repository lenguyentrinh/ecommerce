import { IsNotEmpty, IsEmail } from 'class-validator';

export default class VerifyOtpDto {
  @IsNotEmpty({ message: 'Email should not be empty!' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'OTP should not be empty!' })
  otp: string;
}
