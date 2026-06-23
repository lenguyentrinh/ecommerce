# Story 1.2: User Role Extension & Rate Limiting

---
baseline_commit: ecc6f4ac8a40e0bcb161685c025ec48e7133708f
---

Status: in-progress
Review Status: not started

## Story

As an admin,
I want my role to be encoded in my JWT from the moment I log in,
So that the system can protect admin routes without a separate auth layer.

## Acceptance Criteria

**AC1 — Role column added via migration**
Given the existing `User` entity in `backend/src/modules/users/entities/user.entity.ts`,
When the role migration runs via `npm run migration:run`,
Then the `users` table gains a `role ENUM('customer','admin') NOT NULL DEFAULT 'customer'` column; a TypeORM migration file exists under `src/database/migrations/`; `synchronize: false` is confirmed in `database.config.ts`; migration runs cleanly with no errors.

**AC2 — Role in JWT payload**
Given a user successfully logs in via `POST /api/auth/login`,
When the JWT access token is issued by `AuthService.login()`,
Then the JWT payload is `{ sub: user.id, email: user.email, role: user.role }`.

**AC3 — Role on request object**
Given the `JwtStrategy` validates a token,
When `JwtStrategy.validate()` returns,
Then `req.user` has `role` accessible (the full `User` entity returned by `findById` naturally includes `role` after AC1 — no validate() signature change needed; `JwtPayload` interface gains `role` for type accuracy only).

**AC4 — RolesGuard enforces access**
Given a NestJS endpoint is decorated with `@Roles('admin')`,
When a request arrives with a customer JWT,
Then `RolesGuard` returns HTTP 403 Forbidden; a request with an admin JWT passes through; `RolesGuard` is registered as a global guard via `APP_GUARD` in `AppModule`; `@Roles()` decorator is importable from `common/decorators/roles.decorator.ts`.

**AC5 — Rate limiting configured**
Given `@nestjs/throttler` is configured in `AppModule`,
When any request arrives,
Then the global throttle is 60 requests per 60-second window per IP; `AuthController` has an override of 10 requests per 60-second window; rate-limit violations return HTTP 429 with no stack trace.

## Tasks / Subtasks

- [ ] **Task 1: Create UserRole enum and update User entity** (AC1, AC2, AC3)
  - [ ] Create `backend/src/modules/users/entities/user-role.enum.ts` with `enum UserRole { CUSTOMER = 'customer', ADMIN = 'admin' }`
  - [ ] Add `@Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER }) role: UserRole;` to `User` entity (after `phoneNumber` field)
  - [ ] Import `UserRole` in `user.entity.ts`

- [ ] **Task 2: Set up TypeORM CLI data source and migration scripts** (AC1)
  - [ ] Create `backend/src/database/data-source.ts` — standalone `DataSource` for TypeORM CLI (see Dev Notes for exact content)
  - [ ] Add migration scripts to `backend/package.json` (see Dev Notes for exact scripts)
  - [ ] Create `backend/src/database/migrations/` directory (empty — CLI will populate it)

- [ ] **Task 3: Generate and verify migration** (AC1)
  - [ ] Run `npm run migration:generate -- src/database/migrations/AddRoleToUsers` from `backend/` — this generates the migration file
  - [ ] Verify the generated migration adds: `role ENUM('customer','admin') NOT NULL DEFAULT 'customer'`
  - [ ] Run `npm run migration:run` to apply the migration to the local DB

- [ ] **Task 4: Switch `synchronize: false`** (AC1)
  - [ ] In `database.config.ts`: change `synchronize: true` → `synchronize: false`
  - [ ] Add `migrations: [__dirname + '/migrations/*.{ts,js}']` and `migrationsRun: false` to TypeORM config (see Dev Notes)
  - [ ] Verify app still starts cleanly after this change

- [ ] **Task 5: Update JWT payload to include role** (AC2)
  - [ ] In `auth.service.ts` `login()`: change `const payload = { sub: user.id, email: user.email }` → `const payload = { sub: user.id, email: user.email, role: user.role }`
  - [ ] Import `UserRole` if needed for type annotation

- [ ] **Task 6: Update JwtPayload interface** (AC3)
  - [ ] In `jwt.strategies.ts`: add `role: UserRole` to the `JwtPayload` interface
  - [ ] Import `UserRole` enum

- [ ] **Task 7: Create @Roles() decorator** (AC4)
  - [ ] Create `backend/src/common/decorators/roles.decorator.ts` (see Dev Notes for exact content)

- [ ] **Task 8: Create RolesGuard** (AC4)
  - [ ] Create `backend/src/common/guards/roles.guard.ts` (see Dev Notes for exact content)

- [ ] **Task 9: Register RolesGuard globally in AppModule** (AC4)
  - [ ] Import `RolesGuard` and `APP_GUARD` from `@nestjs/core` in `app.module.ts`
  - [ ] Add to `providers`: `{ provide: APP_GUARD, useClass: RolesGuard }`

- [ ] **Task 10: Install and configure @nestjs/throttler** (AC5)
  - [ ] Run `pnpm add @nestjs/throttler` from `backend/` (project uses pnpm — NOT npm install)
  - [ ] Import `ThrottlerModule` and `ThrottlerGuard` in `app.module.ts`
  - [ ] Add `ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60000, limit: 60 }] })` to imports
  - [ ] Add `{ provide: APP_GUARD, useClass: ThrottlerGuard }` to providers (before RolesGuard)
  - [ ] Add `@Throttle({ default: { limit: 10, ttl: 60000 } })` decorator to `AuthController` class (see Dev Notes)

- [ ] **Task 11: Write unit tests** (all ACs)
  - [ ] `backend/src/common/guards/roles.guard.spec.ts` — test 403 for wrong role, pass for correct role, pass when no @Roles set
  - [ ] Update `backend/src/modules/auth/auth.service.spec.ts` (or create it) — verify `login()` JWT payload includes `role`

## Dev Notes

### ⚠️ CRITICAL: Package Manager Is pnpm, NOT npm

From Story 1.1 dev notes: the project uses pnpm. `node_modules` is managed by pnpm. Use `pnpm add <package>` for all new dependencies. Never use `npm install` — it will conflict.

```bash
# CORRECT
cd backend && pnpm add @nestjs/throttler

# WRONG — will corrupt lockfile
npm install @nestjs/throttler
```

### ⚠️ CRITICAL: Migration Sequence — Order Matters

`synchronize: true` is currently live in `database.config.ts`. TypeORM has been auto-syncing the schema. Changing to `synchronize: false` without running a migration first will cause the app to error on next column access if any unsynced changes exist.

**Required sequence:**
1. Add `role` to entity (Task 1)
2. Set up data-source.ts and migration scripts (Task 2)
3. Generate migration: `npm run migration:generate -- src/database/migrations/AddRoleToUsers`
4. Run migration: `npm run migration:run` (creates `migrations` table + applies the role column)
5. THEN change `synchronize: false` (Task 4)

If local DB already has the `role` column from a prior synchronize run, the generated migration will be a no-op for that column (TypeORM diffs the DB state). This is safe.

### TypeORM CLI DataSource Setup

Create `backend/src/database/data-source.ts`:

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
```

Note: `dotenv.config()` is called first (same pattern as `main.ts`) because this file is loaded directly by TypeORM CLI outside of NestJS's ConfigModule.

### Migration Scripts to Add to package.json

Add these to the `scripts` section of `backend/package.json`:

```json
"migration:generate": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:generate",
"migration:run": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:run",
"migration:revert": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:revert",
"migration:show": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:show"
```

`typeorm-ts-node-commonjs` is already available in `node_modules/.bin/` via the `typeorm` package — no additional install needed.

### database.config.ts — Full Updated Config

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const user = config.get<string>('DB_USERNAME');

        return {
          type: 'mysql',
          host: config.get('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 3306),
          username: user || 'root',
          password: config.get<string>('DB_PASSWORD') ?? '',
          database: config.get('DB_NAME', 'ecommerce'),
          autoLoadEntities: true,
          synchronize: false,
          migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
          migrationsRun: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
```

Note: `autoLoadEntities: true` remains — NestJS still registers entities via `TypeOrmModule.forFeature()`. The `migrations` path here is informational for the runtime; the CLI uses `data-source.ts`.

### @Roles() Decorator

Create `backend/src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### RolesGuard

Create `backend/src/common/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
```

**Important**: `RolesGuard` must be ordered AFTER `ThrottlerGuard` in `AppModule` providers. Both are `APP_GUARD` — NestJS applies them in registration order. Throttle check → Role check is the correct sequence.

### AppModule — Final Shape After This Story

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.config';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [jwtConfig],
    }),
    DatabaseModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 60 }],
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

### AuthController — Throttle Override

Add to `auth.controller.ts`:

```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController { ... }
```

The `@Throttle` decorator at the class level overrides the global `default` throttler for all routes in `AuthController`. No per-method decoration needed — applies to login, signup, verify-email, etc. uniformly.

### User Entity — Role Column Placement

Add between `phoneNumber` and `emailVerified`:

```typescript
import { UserRole } from './user-role.enum';

// In class body, after phoneNumber:
@Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
role: UserRole;
```

Full updated entity column order: `id`, `userName`, `email`, `password`, `birthDate`, `phoneNumber`, `role`, `emailVerified`, `emailOtpCode`, `emailOtpExpires`, `resetPasswordToken`, `resetPasswordExpired`, `createAt`.

### JwtPayload Interface Update

In `jwt.strategies.ts`:

```typescript
import { UserRole } from '../../modules/users/entities/user-role.enum';

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;  // added — decoded from token for type accuracy
}
```

`validate()` continues to return `this.usersService.findById(payload.sub)` — the full `User` entity. This is intentional:
- `req.user` on the `GET /auth/me` endpoint still has `userName`, `birthDate`, `phoneNumber`, etc. — no regression on that endpoint.
- `RolesGuard` reads `req.user.role` which exists on the `User` entity after Task 1.
- The AC "JwtStrategy.validate() returns `{ id, email, role }` on the request object" is satisfied because `User` entity has all three fields.

### AuthService — Login Payload Change

```typescript
// Before (line 68)
const payload = { sub: user.id, email: user.email };

// After
const payload = { sub: user.id, email: user.email, role: user.role };
```

No other changes to `auth.service.ts`. The `user` object from `findByEmail()` will have `role: UserRole.CUSTOMER` by default once the migration runs and entity is updated.

### ⚠️ CRITICAL: `GET /auth/me` Must Not Break

`auth.controller.ts` line 55–60 currently returns `userName`, `birthDate`, `phoneNumber`, `emailVerified`, `createAt`. These come from `req.user` which is the full `User` entity returned by `validate()`. Do NOT change `validate()` to return a slim object — it would break the `/me` endpoint.

After this story, you may optionally add `role` to the `/me` response for completeness:
```typescript
return {
  id: user.id,
  userName: user.userName,
  email: user.email,
  role: user.role,  // add this
  birthDate: user.birthDate,
  phoneNumber: user.phoneNumber,
  emailVerified: user.emailVerified,
  createAt: user.createAt,
};
```
This is optional but recommended to surface the role to the frontend.

### File Locations Reference

| Action | File Path |
|--------|-----------|
| NEW | `backend/src/modules/users/entities/user-role.enum.ts` |
| UPDATE | `backend/src/modules/users/entities/user.entity.ts` |
| NEW | `backend/src/database/data-source.ts` |
| UPDATE | `backend/src/database/database.config.ts` |
| NEW | `backend/src/database/migrations/` (directory) |
| NEW | `backend/src/database/migrations/<timestamp>-AddRoleToUsers.ts` (generated) |
| UPDATE | `backend/src/modules/auth/auth.service.ts` |
| UPDATE | `backend/src/modules/auth/strategies/jwt.strategies.ts` |
| UPDATE | `backend/src/modules/auth/auth.controller.ts` |
| UPDATE | `backend/src/app.module.ts` |
| UPDATE | `backend/package.json` |
| NEW | `backend/src/common/decorators/roles.decorator.ts` |
| NEW | `backend/src/common/guards/roles.guard.ts` |
| NEW | `backend/src/common/guards/roles.guard.spec.ts` |

### @nestjs/throttler Version Note

Install `@nestjs/throttler` without a version pin — latest v6.x is compatible with NestJS 11. The `ThrottlerModule.forRoot({ throttlers: [...] })` API is v5+. If a `@types/throttler` error appears, it is not needed — `@nestjs/throttler` ships its own types.

### Testing Pattern for RolesGuard

```typescript
// roles.guard.spec.ts — minimal unit test
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockContext = (role: UserRole | undefined, handler = jest.fn(), cls = class {}) => ({
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: () => ({ user: role !== undefined ? { role } : undefined }),
    }),
  }) as any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('passes when no @Roles is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(UserRole.CUSTOMER))).toBe(true);
  });

  it('passes when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext(UserRole.ADMIN))).toBe(true);
  });

  it('blocks when user has wrong role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext(UserRole.CUSTOMER))).toBe(false);
  });

  it('blocks when user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });
});
```

### Architecture Compliance

- D1 (TypeORM sync strategy): `synchronize: false` is a **Critical** decision per `core-architectural-decisions.md`. Must be enforced.
- D6 (Admin role): `role: enum('customer', 'admin')` on User entity — exactly as designed.
- D8 (Rate limiting): `@nestjs/throttler`, 60/min global, 10/min auth — exactly as designed.
- No `synchronize: true` must remain in any config file after this story ships.

### Previous Story Learnings (from Story 1.1)

- **pnpm is the package manager** — confirmed again: use `pnpm add`, not `npm install`
- **Backend module: `nodenext`** — TypeScript `nodenext` module system means imports may need `.js` extensions in some edge cases, but NestJS CLI handles this automatically
- **Single quotes + trailing commas** — Prettier config applies to all `.ts` files including new guard/decorator files

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

_to be filled by dev agent_

### Completion Notes List

_to be filled by dev agent_

### File List

_to be filled by dev agent_
