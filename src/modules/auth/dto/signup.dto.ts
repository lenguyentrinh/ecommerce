import { IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class SignupDto{
    @IsNotEmpty({message: "User name should not be empty!"})
    userName: string;

    @IsNotEmpty({ message: 'Email should not be empty!' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
    
    @IsNotEmpty({ message: 'Password should not be empty!' })
    password: string;

    @IsOptional()
    birthDate?: string;

    @IsOptional()
    phoneNumber?: string;
}