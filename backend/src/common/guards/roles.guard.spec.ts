/// <reference types="jest" />

import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (
    role: UserRole | undefined,
  ): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role !== undefined ? { role } : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('passes when no @Roles decorator is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockExecutionContext(UserRole.CUSTOMER))).toBe(
      true,
    );
  });

  it('passes when @Roles is empty array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    expect(guard.canActivate(mockExecutionContext(UserRole.CUSTOMER))).toBe(
      true,
    );
  });

  it('passes when user has the required admin role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockExecutionContext(UserRole.ADMIN))).toBe(true);
  });

  it('blocks when user has customer role but admin is required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockExecutionContext(UserRole.CUSTOMER))).toBe(
      false,
    );
  });

  it('throws UnauthorizedException when user is not authenticated (no user on request)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockExecutionContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('blocks when user is present but role is null or undefined', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const contextWithNullRole = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: null } }),
      }),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(contextWithNullRole)).toBe(false);
  });

  it('passes when user has one of multiple allowed roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.CUSTOMER]);
    expect(guard.canActivate(mockExecutionContext(UserRole.CUSTOMER))).toBe(
      true,
    );
  });
});
