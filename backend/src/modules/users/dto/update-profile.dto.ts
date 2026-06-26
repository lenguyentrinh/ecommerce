import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// `email` is intentionally absent — it is read-only and must never be editable.
export default class UpdateProfileDto {
  @IsOptional()
  @IsNotEmpty({ message: 'User name should not be empty!' })
  @IsString({ message: 'User name must be a string' })
  userName?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phoneNumber?: string;
}
