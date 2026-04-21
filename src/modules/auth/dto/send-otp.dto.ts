import { IsNotEmpty, IsEmail } from 'class-validator';

export default class SendOtpDto {
  @IsNotEmpty({ message: 'Email should not be empty!' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}