# Backend Architecture - NestJS API Server

## Overview

The backend is a NestJS API server that handles authentication, user management, and email services. It uses TypeORM for database operations with MySQL and Passport JWT for authentication.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    REST API Layer                                │
│            (Controllers - HTTP Request Handlers)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Business Logic Layer                             │
│              (Services - Core Application Logic)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               Data Access Layer                                  │
│        (TypeORM Repository - Database Operations)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database                                │
│                   (Persistent Storage)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Module Architecture

### Root Module (AppModule)

**File**: `backend/src/app.module.ts`

The root module imports and configures:

1. **ConfigModule** - Global environment configuration
   - Loads JWT configuration from `jwt.config.ts`
   - Environment variables from `.env` file
   - Makes config available application-wide

2. **DatabaseModule** - TypeORM setup
   - Configures MySQL connection
   - Auto-loads entities
   - Enables database synchronization

3. **AuthModule** - Authentication feature

### Auth Module (AuthModule)

**File**: `backend/src/modules/auth/auth.module.ts`

Responsible for user authentication and account security.

**Imports**:
- `UsersModule` - User management operations
- `PassportModule` - Passport authentication framework
- `JwtModule` - JWT token generation and validation
- `ConfigModule` - Configuration access
- `MailModule` - Email sending for OTP

**Controllers**:
- `AuthController` - Handles auth HTTP endpoints

**Providers**:
- `AuthService` - Core authentication logic
- `JwtStrategy` - Passport JWT strategy implementation

**Key Responsibilities**:
- User signup with email verification
- User login with JWT token generation
- Email verification via OTP
- Password reset flow
- OTP management

### Users Module (UsersModule)

**File**: `backend/src/modules/users/user.module.ts`

Manages user profile and authentication data.

**Services**:
- `UserService` - CRUD operations on users

**Entities**:
- `User` - TypeORM entity representing users table

**Key Responsibilities**:
- Create new user accounts
- Find users by email or ID
- Update user authentication tokens
- Manage OTP codes and expiration
- Update passwords

### Mail Module (MailModule)

**File**: `backend/src/modules/mail/mail.module.ts`

Handles email communications.

**Services**:
- `MailService` - Email sending using Nodemailer

**Key Responsibilities**:
- Send OTP emails for verification
- Send password reset emails
- HTML email template generation

## Core Components

### Controllers

#### AuthController

**File**: `backend/src/modules/auth/auth.controller.ts`

HTTP endpoints for authentication operations:

```typescript
@Controller('auth')
export class AuthController {
  // POST /auth/login
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response)
  
  // POST /auth/signup
  @Post('signup')
  signup(@Body() signupDto: SignupDto)
  
  // POST /auth/forgot-password
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto)
  
  // POST /auth/verify-email
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto)
  
  // POST /auth/send-otp
  @Post('send-otp')
  sendOtp(@Body() sendOtpDto: SendOtpDto)
  
  // POST /auth/verify-otp
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto)
  
  // POST /auth/reset-password
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto)
}
```

**Request/Response Handling**:
- Validates incoming DTOs
- JWT tokens stored in httpOnly cookies (secure)
- CORS enabled for frontend communication
- Global validation pipe enforces strict validation

### Services

#### AuthService

**File**: `backend/src/modules/auth/auth.service.ts`

Core authentication business logic:

**Methods**:

1. **signup(dto: SignupDto)**
   - Hash password using bcrypt (10 salt rounds)
   - Create new user via UserService
   - Generate 6-digit OTP code
   - Set OTP expiration (5 minutes)
   - Send OTP email
   - Returns email for confirmation

2. **login(dto: LoginDto)**
   - Find user by email
   - Verify email is confirmed
   - Compare password with hash
   - Generate JWT token with payload: `{ sub: userId, email }`
   - Return token
   - Client stores token in cookie

3. **verifyEmail(dto: VerifyEmailDto)**
   - Validate OTP against stored code
   - Check OTP expiration
   - Mark email as verified
   - Return success message

4. **sendOtp(dto: SendOtpDto)**
   - Find user by email
   - Generate new OTP
   - Update OTP and expiration in database
   - Send OTP email
   - Return confirmation message

5. **verifyOtp(dto: VerifyOtpDto)**
   - Verify OTP matches stored code
   - Check OTP not expired
   - Return success message

6. **forgotPassword(dto: ForgotPasswordDto)**
   - Find user by email
   - Generate reset token (UUID v4)
   - Set token expiration (1 hour)
   - Store token in database

7. **resetPassword(dto: ResetPasswordDto)**
   - Find user by email
   - Validate passwords match
   - Ensure new password differs from current
   - Hash new password
   - Update password in database

#### UserService

**File**: `backend/src/modules/users/user.service.ts`

User data management:

**Methods**:
- `create(dto)` - Create user account
- `findByEmail(email)` - Lookup user
- `findById(id)` - Get user by ID
- `updateResetToken(id, token, expires)` - Store password reset token
- `setEmailOTP(id, otp, expires)` - Store OTP code
- `verifyEmailOtp(email, otp)` - Validate and mark email verified
- `updatePassword(id, newPassword)` - Update user password

#### MailService

**File**: `backend/src/modules/mail/mail.service.ts`

Email operations using Nodemailer:

**Methods**:
- `sendOtpEmail(email, code, expiresAt)` - Send OTP to email

### Entities (Data Models)

#### User Entity

**File**: `backend/src/modules/users/entities/user.entity.ts`

TypeORM entity mapping to `users` table:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userName: string;              // Required, not empty

  @Column({ unique: true })
  email: string;                 // Required, unique, valid email

  @Column()
  password: string;              // Required, min 6 chars, hashed

  @Column({ nullable: true })
  birthDate: string;             // Optional user profile data

  @Column({ nullable: true })
  phoneNumber: string;           // Optional user profile data

  @Column({ default: false })
  emailVerified: boolean;        // Email verification status

  @Column({ nullable: true })
  emailOtpCode: string;          // Current OTP code

  @Column({ type: 'timestamp', nullable: true })
  emailOtpExpires: Date;         // OTP expiration time

  @Column({ nullable: true })
  resetPasswordToken: string;    // Password reset token

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpired: Date;    // Reset token expiration

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;                // Account creation timestamp
}
```

**Database Schema**:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  birthDate VARCHAR(255),
  phoneNumber VARCHAR(255),
  emailVerified BOOLEAN DEFAULT FALSE,
  emailOtpCode VARCHAR(255),
  emailOtpExpires TIMESTAMP,
  resetPasswordToken VARCHAR(255),
  resetPasswordExpired TIMESTAMP,
  createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Authentication Strategy

#### JwtStrategy

**File**: `backend/src/modules/auth/strategies/jwt.strategies.ts`

Passport JWT strategy for protecting routes:

**JWT Extraction Logic**:
1. First checks for token in httpOnly cookie (`access_token`)
2. Falls back to Authorization header (`Bearer <token>`)
3. Validates token signature and expiration

**JWT Payload**:
```typescript
interface JwtPayload {
  sub: number;      // User ID
  email: string;    // User email
}
```

**Validation Flow**:
1. Extract JWT from request (cookie or header)
2. Verify token signature using JWT secret
3. Extract payload
4. Fetch user from database by ID
5. Attach user to request object
6. Allow request to proceed if user found

## Configuration

### Environment Variables

**Required variables** (in `.env`):

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=ecommerce

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1d

# API
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3001
```

### JWT Configuration

**File**: `backend/src/config/jwt.config.ts`

Loaded via ConfigService:
- Secret key for signing/verifying tokens
- Expiration time (default 1 day)
- Algorithm: HS256 (HMAC SHA256)

## Global Middleware & Pipes

### Setup (main.ts)

1. **Cookie Parser** - Parse httpOnly cookies from requests
2. **CORS** - Allow frontend requests
   - Development: Allow all origins
   - Production: Only allow FRONTEND_URL
   - Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
   - Credentials: true (send cookies)

3. **Global Validation Pipe**
   - Whitelist: Strip unknown properties
   - forbidNonWhitelisted: Reject unknown properties
   - transform: Auto-convert types (string to number, etc.)

4. **Swagger/OpenAPI** - API documentation
   - Endpoint: `/api`
   - Bearer auth supported

## Error Handling

Common HTTP exceptions:

- **UnauthorizedException** (401) - Invalid credentials, invalid token
- **ConflictException** (409) - Email already exists
- **BadRequestException** (400) - Invalid input, validation errors

## Database Setup

### TypeORM Configuration

**File**: `backend/src/database/database.config.ts`

```typescript
{
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '...',
  database: 'ecommerce',
  autoLoadEntities: true,    // Auto-load entity files
  synchronize: true,         // Auto-create/update tables
}
```

**Features**:
- Automatic entity discovery
- Schema synchronization (development)
- Connection pooling

## Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Passwords never stored in plain text
   - Never returned in API responses

2. **JWT Security**
   - Signed with secret key
   - Expiration enforcement
   - Stored in httpOnly cookies (XSS protection)
   - Secure flag in production

3. **Input Validation**
   - DTO validation with class-validator
   - Email format validation
   - Password length requirements
   - Type checking and transformation

4. **OTP Security**
   - 6-digit random codes
   - 5-minute expiration
   - Used for email and password reset

## Deployment Considerations

1. Set `NODE_ENV=production`
2. Configure `FRONTEND_URL` for CORS
3. Use environment-based JWT secret management
4. Enable HTTPS/TLS
5. Use database connection pooling
6. Monitor JWT token expiration
7. Implement rate limiting
8. Add request logging and monitoring

## Testing

Jest test setup in `package.json`:

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {"^.+\\.(t|j)s$": "ts-jest"},
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "testEnvironment": "node"
  }
}
```

Run tests: `npm run test`

## Development Workflow

1. **Start Development Server**: `npm run start:dev` (watch mode)
2. **View API Docs**: http://localhost:3000/api
3. **Test Endpoints**: Use Postman or curl
4. **Check Logs**: Watch console output for errors
5. **Debug**: Use `npm run debug:ts` for debugging

**Next: See [Integration Architecture](./integration-architecture.md) for frontend-backend communication details.**
