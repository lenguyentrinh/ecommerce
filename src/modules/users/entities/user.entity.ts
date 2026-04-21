import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty({ message: 'User name should not be empty!' })
  userName: string;

  @Column({ unique: true })
  @IsNotEmpty({ message: 'Email should not be empty!' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Column()
  @IsNotEmpty({ message: 'Password should not be empty!' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @Column({ nullable: true })
  birthDate: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailOtpCode: string;

  @Column({ type: 'timestamp', nullable: true })
  emailOtpExpires: Date | null;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpired: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;
}
