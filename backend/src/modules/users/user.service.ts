import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import SignupDto from '../auth/dto/signup.dto';
import UpdateProfileDto from './dto/update-profile.dto';
import CreateAddressDto from './dto/create-address.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  create(dto: SignupDto): Promise<User> {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  updateResetToken(id: number, token: string, expired: Date) {
    return this.userRepository.update(id, {
      resetPasswordToken: token,
      resetPasswordExpired: expired,
    });
  }

  async setEmailOTP(id: number, otp: string, expires: Date) {
    return this.userRepository.update(id, {
      emailOtpCode: otp,
      emailOtpExpires: expires,
    });
  }

  async verifyEmailOtp(email: string, otp: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    if (!user.emailOtpCode || !user.emailOtpExpires) return null;
    if (user.emailOtpExpires < new Date()) return null;
    if (user.emailOtpCode !== otp) return null;
    user.emailVerified = true;
    return this.userRepository.save(user);
  }

  async updatePassword(id: number, newPassword: string) {
    return this.userRepository.update(id, { password: newPassword });
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  // Returns a sanitized user (the same shape as GET /auth/me's allow-list) so
  // sensitive fields (password, OTP/reset tokens) never leak to the client.
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.userName !== undefined) user.userName = dto.userName;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;

    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      userName: saved.userName,
      email: saved.email,
      phoneNumber: saved.phoneNumber ?? null,
      role: saved.role,
    };
  }

  // ── Addresses ───────────────────────────────────────────────────────────────

  getAddresses(userId: number): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async addAddress(userId: number, dto: CreateAddressDto): Promise<Address> {
    const count = await this.addressRepository.count({ where: { userId } });
    if (count >= 2) {
      throw new ConflictException('Maximum 2 addresses reached');
    }

    // The first address is default; an explicit isDefault also wins.
    const makeDefault = dto.isDefault === true || count === 0;
    if (makeDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    const address = this.addressRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      street: dto.street,
      city: dto.city,
      isDefault: makeDefault,
      userId,
    });
    return this.addressRepository.save(address);
  }

  async editAddress(
    userId: number,
    addressId: number,
    dto: CreateAddressDto,
  ): Promise<Address> {
    const address = await this.findOwnedAddress(userId, addressId);

    if (dto.isDefault === true) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    address.firstName = dto.firstName;
    address.lastName = dto.lastName;
    address.street = dto.street;
    address.city = dto.city;
    if (dto.isDefault !== undefined) address.isDefault = dto.isDefault;

    return this.addressRepository.save(address);
  }

  async setDefaultAddress(
    userId: number,
    addressId: number,
  ): Promise<Address[]> {
    const address = await this.findOwnedAddress(userId, addressId);

    await this.addressRepository.update({ userId }, { isDefault: false });
    address.isDefault = true;
    await this.addressRepository.save(address);

    return this.getAddresses(userId);
  }

  async removeAddress(
    userId: number,
    addressId: number,
  ): Promise<{ message: string }> {
    const address = await this.findOwnedAddress(userId, addressId);
    await this.addressRepository.remove(address);
    return { message: 'Address removed' };
  }

  // Ownership check — never leak another user's rows.
  private async findOwnedAddress(
    userId: number,
    addressId: number,
  ): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }
}
