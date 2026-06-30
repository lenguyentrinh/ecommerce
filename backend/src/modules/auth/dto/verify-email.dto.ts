import { IsNotEmpty, IsEmail } from 'class-validator';

export default class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  code: string;
}
