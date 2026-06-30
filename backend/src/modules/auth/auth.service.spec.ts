import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { MailService } from '../mail/mail.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../users/entities/user-role.enum';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: '$2b$10$hashedpassword',
  emailVerified: true,
  role: UserRole.CUSTOMER,
  userName: 'Test User',
  birthDate: null,
  phoneNumber: null,
  emailOtpCode: null,
  emailOtpExpires: null,
  resetPasswordToken: null,
  resetPasswordExpired: null,
  createAt: new Date(),
};

describe('AuthService - login', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-token') },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            setEmailOTP: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: { sendOtpEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  it('includes role in JWT payload on login', async () => {
    jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await service.login({ email: 'test@example.com', password: 'password' });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: mockUser.id,
      email: mockUser.email,
      role: UserRole.CUSTOMER,
    });
  });

  it('includes admin role in JWT payload when user is admin', async () => {
    const adminUser = { ...mockUser, role: UserRole.ADMIN };
    jest.spyOn(userService, 'findByEmail').mockResolvedValue(adminUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await service.login({ email: 'admin@example.com', password: 'password' });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: adminUser.id,
      email: adminUser.email,
      role: UserRole.ADMIN,
    });
  });

  it('throws UnauthorizedException when user not found', async () => {
    jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

    await expect(
      service.login({ email: 'no@example.com', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when email not verified', async () => {
    const unverifiedUser = { ...mockUser, emailVerified: false };
    jest
      .spyOn(userService, 'findByEmail')
      .mockResolvedValue(unverifiedUser as any);

    await expect(
      service.login({ email: 'test@example.com', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
