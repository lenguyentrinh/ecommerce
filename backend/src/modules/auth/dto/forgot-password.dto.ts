import { IsEmail, IsNotEmpty } from 'class-validator';

export default class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email should not be empty!' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
