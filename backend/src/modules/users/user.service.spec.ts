import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { UserRole } from './entities/user-role.enum';

describe('UserService (profile + addresses)', () => {
  let service: UserService;
  let userRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let addressRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    addressRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Address), useValue: addressRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('updateProfile', () => {
    it('updates only the provided fields and never returns sensitive fields', async () => {
      const existing = {
        id: 1,
        userName: 'Old Name',
        email: 'shopper@example.com',
        phoneNumber: '0111',
        password: 'hashed-secret',
        emailOtpCode: '123456',
        resetPasswordToken: 'tok',
        role: UserRole.CUSTOMER,
      } as unknown as User;
      userRepository.findOne.mockResolvedValue(existing);
      userRepository.save.mockImplementation((u: User) => Promise.resolve(u));

      const result = await service.updateProfile(1, { userName: 'New Name' });

      // phoneNumber was not provided → unchanged
      expect(existing.userName).toBe('New Name');
      expect(existing.phoneNumber).toBe('0111');

      // sanitized allow-list only
      expect(result).toEqual({
        id: 1,
        userName: 'New Name',
        email: 'shopper@example.com',
        phoneNumber: '0111',
        role: UserRole.CUSTOMER,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('emailOtpCode');
      expect(result).not.toHaveProperty('resetPasswordToken');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfile(99, { userName: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addAddress', () => {
    it('throws ConflictException when a 3rd address is added', async () => {
      addressRepository.count.mockResolvedValue(2);
      await expect(
        service.addAddress(1, {
          firstName: 'A',
          lastName: 'B',
          street: '1 St',
          city: 'Town',
        }),
      ).rejects.toThrow(ConflictException);
      expect(addressRepository.save).not.toHaveBeenCalled();
    });

    it('makes the first address default and clears any prior defaults', async () => {
      addressRepository.count.mockResolvedValue(0);
      addressRepository.create.mockImplementation((a: Address) => a);
      addressRepository.save.mockImplementation((a: Address) =>
        Promise.resolve(a),
      );

      const result = await service.addAddress(1, {
        firstName: 'A',
        lastName: 'B',
        street: '1 St',
        city: 'Town',
      });

      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: 1 },
        { isDefault: false },
      );
      expect(result.isDefault).toBe(true);
      expect(result.userId).toBe(1);
    });
  });

  describe('setDefaultAddress', () => {
    it('flips the chosen row to default and clears the others', async () => {
      const target = { id: 5, userId: 1, isDefault: false } as Address;
      addressRepository.findOne.mockResolvedValue(target);
      addressRepository.save.mockImplementation((a: Address) =>
        Promise.resolve(a),
      );
      const fullList = [
        { id: 4, userId: 1, isDefault: false },
        { id: 5, userId: 1, isDefault: true },
      ] as Address[];
      addressRepository.find.mockResolvedValue(fullList);

      const result = await service.setDefaultAddress(1, 5);

      expect(addressRepository.update).toHaveBeenCalledWith(
        { userId: 1 },
        { isDefault: false },
      );
      expect(target.isDefault).toBe(true);
      expect(result).toBe(fullList);
    });

    it('throws NotFoundException when the address belongs to another user', async () => {
      addressRepository.findOne.mockResolvedValue({
        id: 5,
        userId: 2,
      } as Address);
      await expect(service.setDefaultAddress(1, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('editAddress', () => {
    it('throws NotFoundException when the address belongs to another user', async () => {
      addressRepository.findOne.mockResolvedValue({
        id: 5,
        userId: 2,
      } as Address);
      await expect(
        service.editAddress(1, 5, {
          firstName: 'A',
          lastName: 'B',
          street: '1 St',
          city: 'Town',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAddress', () => {
    it('throws NotFoundException when the address is missing', async () => {
      addressRepository.findOne.mockResolvedValue(null);
      await expect(service.removeAddress(1, 5)).rejects.toThrow(
        NotFoundException,
      );
      expect(addressRepository.remove).not.toHaveBeenCalled();
    });

    it('removes an owned address and returns a confirmation message', async () => {
      const owned = { id: 5, userId: 1 } as Address;
      addressRepository.findOne.mockResolvedValue(owned);
      addressRepository.remove.mockResolvedValue(owned);

      const result = await service.removeAddress(1, 5);

      expect(addressRepository.remove).toHaveBeenCalledWith(owned);
      expect(result).toEqual({ message: 'Address removed' });
    });
  });
});
