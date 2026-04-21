import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export default class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email should not be empty!' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'New password should not be empty!' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

  @IsNotEmpty({ message: 'Confirm password should not be empty!' })
  confirmNewPassword: string;
}