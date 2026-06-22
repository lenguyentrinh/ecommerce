# Data Models & Database Schema

## Database Overview

- **Type**: MySQL 8.0+
- **ORM**: TypeORM 0.3.28
- **Synchronization**: Auto-sync enabled (development)
- **Connection**: Configured in `backend/src/database/database.config.ts`

---

## User Entity

### TypeORM Entity Definition

**File**: `backend/src/modules/users/entities/user.entity.ts`

```typescript
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
```

### SQL Schema

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
  createAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_emailVerified (emailVerified)
);
```

### Column Specifications

#### Primary Key

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | INT | PRIMARY KEY AUTO_INCREMENT | Unique user identifier |

#### User Identity

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `userName` | VARCHAR(255) | NOT NULL | User's display name |
| `email` | VARCHAR(255) | UNIQUE NOT NULL | User's email address |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password (60 chars) |

#### User Profile

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `birthDate` | VARCHAR(255) | NULLABLE | User's date of birth (ISO format recommended) |
| `phoneNumber` | VARCHAR(255) | NULLABLE | User's phone number with country code |

#### Email Verification

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `emailVerified` | BOOLEAN | DEFAULT FALSE | Email confirmation status |
| `emailOtpCode` | VARCHAR(255) | NULLABLE | 6-digit OTP for email verification |
| `emailOtpExpires` | TIMESTAMP | NULLABLE | OTP expiration time (5 minutes from generation) |

#### Password Reset

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `resetPasswordToken` | VARCHAR(255) | NULLABLE | UUID v4 token for password reset |
| `resetPasswordExpired` | TIMESTAMP | NULLABLE | Token expiration time (1 hour from generation) |

#### Audit

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `createAt` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |

---

## Data Type Specifications

### Password Storage

- **Hashing Algorithm**: Bcrypt with 10 salt rounds
- **Storage Format**: 60-character hash
- **Example**: `$2b$10$...` (bcrypt format)
- **Never stored**: Plain text passwords
- **Never returned**: Password field in API responses

### OTP Format

- **Code Format**: 6-digit numeric string
- **Range**: 100000 - 999999
- **Generation**: `Math.floor(100000 + Math.random() * 900000)`
- **Expiration**: 5 minutes (300 seconds)
- **Example**: `"123456"`

### Date Format

**Birth Date**:
- Recommended: ISO 8601 format `YYYY-MM-DD` (e.g., `"1990-01-15"`)
- Storage: VARCHAR for flexibility
- Client: User selects via date picker

**Timestamps**:
- `emailOtpExpires`: Database TIMESTAMP
- `resetPasswordExpired`: Database TIMESTAMP
- `createAt`: Database TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- Format: `YYYY-MM-DD HH:MM:SS`

### Phone Number Format

- Storage: VARCHAR(255)
- Recommended: International format with country code (e.g., `"+1-555-0123"`)
- No validation constraints in current implementation

---

## Validation Rules

### User Entity Decorators

**class-validator decorators** applied at entity level:

```typescript
@IsNotEmpty() - Field cannot be empty/null
@IsEmail() - Valid email format
@MinLength(6) - Password minimum 6 characters
```

### Backend Validation (Services)

**In AuthService**:

1. **Password Validation**
   - Minimum length: 6 characters
   - Cannot be same as current password during reset

2. **Email Validation**
   - Must be valid email format
   - Must be unique in database
   - Case-insensitive comparison recommended

3. **OTP Validation**
   - Must match stored code exactly
   - Must not be expired
   - Must be 6 digits

4. **Password Reset Token**
   - UUID v4 format
   - Must not be expired
   - Checked before password update

### Frontend Validation (React Hook Form)

**In form components**:

```typescript
register('email', {
  required: 'Email required',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  }
})

register('password', {
  required: 'Password required',
  minLength: {
    value: 6,
    message: 'Password must be at least 6 characters'
  }
})
```

---

## Database Operations

### User Creation (Signup)

**Service**: `UserService.create()`

```typescript
async create(dto: SignupDto): Promise<User> {
  const user = this.userRepository.create(dto);
  return this.userRepository.save(user);
}
```

**Data Flow**:
1. Frontend sends SignupPayload to `/auth/signup`
2. Backend hashes password with bcrypt
3. Backend creates User entity from DTO
4. TypeORM saves to database
5. Returns created user (without password)

**Database Insert**:
```sql
INSERT INTO users (userName, email, password, birthDate, phoneNumber, emailVerified, createAt)
VALUES ('john_doe', 'john@example.com', '$2b$10$...', '1990-01-15', '+1-555-0123', false, NOW());
```

### User Lookup (by email)

**Service**: `UserService.findByEmail()`

```typescript
async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email } });
}
```

**Database Query**:
```sql
SELECT * FROM users WHERE email = 'john@example.com' LIMIT 1;
```

### User Lookup (by ID)

**Service**: `UserService.findById()`

```typescript
async findById(id: number): Promise<User | null> {
  return this.userRepository.findOne({ where: { id } });
}
```

**Database Query**:
```sql
SELECT * FROM users WHERE id = 1 LIMIT 1;
```

### Email OTP Update

**Service**: `UserService.setEmailOTP()`

```typescript
async setEmailOTP(id: number, otp: string, expires: Date) {
  return this.userRepository.update(id, {
    emailOtpCode: otp,
    emailOtpExpires: expires,
  });
}
```

**Database Update**:
```sql
UPDATE users 
SET emailOtpCode = '123456', 
    emailOtpExpires = '2026-06-22 14:05:00'
WHERE id = 1;
```

### Email Verification

**Service**: `UserService.verifyEmailOtp()`

```typescript
async verifyEmailOtp(email: string, otp: string): Promise<User | null> {
  const user = await this.userRepository.findOne({ where: { email } });
  if (!user) return null;
  if (!user.emailOtpCode || !user.emailOtpExpires) return null;
  if (user.emailOtpExpires < new Date()) return null;
  if (user.emailOtpCode !== otp) return null;
  
  user.emailVerified = true;
  return this.userRepository.save(user);
}
```

**Validation Steps**:
1. Find user by email
2. Check OTP code exists
3. Check OTP not expired
4. Compare OTP codes
5. Mark emailVerified = true
6. Save and return user

**Database Update**:
```sql
UPDATE users 
SET emailVerified = true
WHERE email = 'john@example.com';
```

### Password Reset Token Storage

**Service**: `UserService.updateResetToken()`

```typescript
async updateResetToken(id: number, token: string, expired: Date) {
  return this.userRepository.update(id, {
    resetPasswordToken: token,
    resetPasswordExpired: expired,
  });
}
```

**Database Update**:
```sql
UPDATE users 
SET resetPasswordToken = 'uuid-v4-here',
    resetPasswordExpired = '2026-06-22 14:00:00'
WHERE id = 1;
```

### Password Update

**Service**: `UserService.updatePassword()`

```typescript
async updatePassword(id: number, newPassword: string) {
  return this.userRepository.update(id, { password: newPassword });
}
```

**Database Update**:
```sql
UPDATE users 
SET password = '$2b$10$...(new hash)...'
WHERE id = 1;
```

---

## Entity Relationships

Currently, the User entity stands alone with no foreign key relationships.

**Future Entities** (planned):
- `Product` - Product catalog
- `Order` - Customer orders
- `OrderItem` - Items in orders
- `Review` - Product reviews

**Relationship Example** (when Orders added):
```
User (1) <---> (N) Order
  id            userId (Foreign Key)
                orderId
```

---

## Indexes & Performance

### Current Indexes

Recommended indexes based on query patterns:

```sql
-- Primary Key (automatic)
PRIMARY KEY (id)

-- Unique constraint (automatic)
UNIQUE KEY (email)

-- Query optimization (recommended)
INDEX idx_email (email)
INDEX idx_emailVerified (emailVerified)
```

### Query Optimization

**High-frequency queries**:
- `SELECT * FROM users WHERE email = ?` → Indexed
- `SELECT * FROM users WHERE id = ?` → Primary key indexed
- `SELECT * FROM users WHERE emailVerified = true` → Index recommended

---

## Backup & Recovery

### Data Loss Risks

**Consider implementing**:
1. Regular database backups (daily/weekly)
2. Transaction logs for point-in-time recovery
3. Replication for high availability
4. Test recovery procedures regularly

### Important User Data

Protect with appropriate backups:
- Email addresses (recovery)
- Password hashes (security)
- Verification status (access control)
- Phone numbers (user contact)

---

## Migration & Evolution

### Schema Changes

With `synchronize: true` in development:
- TypeORM auto-creates tables from entities
- NOT recommended for production
- Use proper migration tools in production:

```bash
npm run typeorm migration:generate
npm run typeorm migration:run
npm run typeorm migration:revert
```

### Backward Compatibility

When adding fields:
1. Add `nullable: true` initially
2. Provide default values for existing rows
3. Update frontend when field becomes required
4. Set `nullable: false` in subsequent migration

---

## Security Considerations

### Password Storage

- Uses bcrypt (industry standard)
- 10 salt rounds (CPU-intensive, secure)
- Never store plain text
- Never log passwords
- Hash immediately on signup

### OTP Security

- 6-digit random codes (1 million combinations)
- Time-limited (5 minutes)
- Single-use (marked verified after use)
- Consider additional rate limiting

### Reset Token Security

- UUID v4 (cryptographically random)
- Not guessable via enumeration
- Time-limited (1 hour)
- Consider invalidating old tokens

### Data Privacy

- Minimize PII collection (only email, phone, DOB)
- Encrypt sensitive fields (consider in production)
- Implement access controls per user
- Log access for audit trails

---

## Related Documentation

- [Architecture - Backend](./architecture-backend.md)
- [API Contracts](./api-contracts.md)
- [Integration Architecture](./integration-architecture.md)
