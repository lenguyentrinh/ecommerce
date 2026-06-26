import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Reused by both add (POST) and edit (PATCH) — both send the full address body.
export default class CreateAddressDto {
  @IsNotEmpty({ message: 'First name should not be empty!' })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name should not be empty!' })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @IsNotEmpty({ message: 'Street address should not be empty!' })
  @IsString({ message: 'Street address must be a string' })
  street: string;

  @IsNotEmpty({ message: 'City should not be empty!' })
  @IsString({ message: 'City must be a string' })
  city: string;

  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean' })
  isDefault?: boolean;
}
