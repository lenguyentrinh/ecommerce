# API Contracts & Endpoints

## API Overview

Base URL: `http://localhost:3000` (development)

All requests use JSON payloads and responses.

Authentication: JWT tokens stored in httpOnly cookies or Authorization header.

---

## Authentication Endpoints

### POST /auth/signup

Register a new user account.

**Request Body**:
```json
{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "birthDate": "1990-01-15",
  "phoneNumber": "+1-555-0123"
}
```

**Response (201 Created)**:
```json
{
  "message": "Signup successful, OTP sent to your email.",
  "email": "john@example.com"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
signupAPI(data: SignupPayload): Promise<SignupResponse>
```

**Redux Action**:
```typescript
dispatch(signupThunk(signupPayload))
```

**Frontend Usage**:
```typescript
const { payload, error } = await dispatch(signupThunk(formData));
if (payload) {
  // Signup successful, user redirected to verify email
  navigate('/verify-email');
}
```

**Error Cases**:
- 409 Conflict: Email already registered
- 400 Bad Request: Invalid input data
- 400 Bad Request: Password too short (min 6 chars)

---

### POST /auth/login

Authenticate user and create session.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK)**:
```json
{
  "message": "Login successful"
}
```

**Response Headers**:
- `Set-Cookie: access_token=<jwt_token>; HttpOnly; Secure; Path=/; Max-Age=86400; SameSite=Lax`

**Frontend Call** (`authAPI.ts`):
```typescript
async function loginAPI(data: LoginPayload): Promise<LoginResponse> {
  const res = await api.post("/auth/login", data);
  return res.data as LoginResponse;
}
```

**Redux Action**:
```typescript
export const loginThunk = createAsyncThunk(
  "auth/login",
  async(data: LoginPayload) => {
    const loginRes = await loginAPI(data);
    const user = await meAPI();  // Fetch current user
    return { message: loginRes.message, user };
  }
);
```

**Frontend Usage**:
```typescript
const result = await dispatch(loginThunk({ email, password }));
if (result.payload) {
  // User logged in, state updated with user data
  navigate('/dashboard');
}
```

**Error Cases**:
- 401 Unauthorized: Email not found
- 401 Unauthorized: Email not verified
- 401 Unauthorized: Invalid password

---

### POST /auth/verify-email

Verify email address with OTP code.

**Request Body**:
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response (200 OK)**:
```json
{
  "message": "Email verified successfully",
  "email": "john@example.com"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
interface verifyEmailPayload {
  email: string | null;
  code: string;
}

verifyEmailAPI(data: verifyEmailPayload): Promise<any>
```

**Redux Action**:
```typescript
dispatch(verifyEmailThunk({ email, code }))
```

**Flow**:
1. User receives OTP in email after signup
2. User enters OTP in verify-email form
3. Frontend sends OTP to backend
4. Backend validates OTP code and expiration
5. If valid, marks email as verified
6. User can now login

**Error Cases**:
- 401 Unauthorized: Invalid OTP code
- 401 Unauthorized: OTP expired (5 minute limit)
- 401 Unauthorized: User email not found

---

### POST /auth/send-otp

Send OTP code to email for password reset flow.

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK)**:
```json
{
  "message": "OTP sent to your email",
  "email": "john@example.com"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
interface sendOtpPayload {
  email: string;
}

sendOtpAPI(data: sendOtpPayload): Promise<any>
```

**Redux Action**:
```typescript
dispatch(sendOtpThunk({ email }))
```

**Flow**:
1. User navigates to forgot password
2. Enters email address
3. Clicks "Send OTP"
4. Backend generates 6-digit OTP
5. Backend sends OTP to email (5 minute expiration)
6. User proceeds to OTP verification step

**Error Cases**:
- 401 Unauthorized: Email not found in system

---

### POST /auth/verify-otp

Verify OTP code during password reset.

**Request Body**:
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200 OK)**:
```json
{
  "message": "OTP verified successfully",
  "email": "john@example.com"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
interface verifyOtpPayload {
  email: string;
  otp: string;
}

verifyOtpAPI(data: verifyOtpPayload): Promise<any>
```

**Redux Action**:
```typescript
dispatch(verifyOtpThunk({ email, otp }))
```

**Flow**:
1. User receives OTP code via email
2. Enters OTP in form
3. Frontend validates OTP with backend
4. Backend checks code and expiration
5. If valid, user proceeds to password reset

**Error Cases**:
- 401 Unauthorized: Invalid OTP code
- 401 Unauthorized: OTP expired

---

### POST /auth/forgot-password

Initiate password reset process.

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK)**:
```json
{
  "message": "Password reset instructions sent to email"
}
```

**Note**: This endpoint appears to only store reset token, not send email. 
Flow typically uses `/auth/send-otp` instead for modern implementations.

**Frontend Call** (`authAPI.ts`):
```typescript
forgotPasswordAPI(data: ForgotPasswordPayload): Promise<any>
```

---

### POST /auth/reset-password

Reset user password with new password.

**Request Body**:
```json
{
  "email": "john@example.com",
  "newPassword": "newSecurePassword456",
  "confirmNewPassword": "newSecurePassword456"
}
```

**Response (200 OK)**:
```json
{
  "message": "Password reset successfully",
  "email": "john@example.com"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
interface resetPasswordPayload {
  email: string;
  newPassword: string;
  confirmNewPassword: string | null;
}

resetPasswordAPI(data: resetPasswordPayload): Promise<any>
```

**Redux Action**:
```typescript
dispatch(resetPasswordThunk({ email, newPassword, confirmNewPassword }))
```

**Flow**:
1. User verifies email with OTP
2. Navigates to reset password form
3. Enters new password and confirmation
4. Frontend validates passwords match
5. Sends to backend with email
6. Backend validates and hashes new password
7. Updates password in database
8. User can now login with new password

**Backend Validation**:
- Passwords must match
- New password must differ from current
- Minimum 6 characters

**Error Cases**:
- 401 Unauthorized: Email not found
- 400 Bad Request: Passwords don't match
- 400 Bad Request: New password same as current

---

### GET /auth/me

Get current authenticated user.

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Cookie: access_token=<jwt_token>
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "email": "john@example.com",
  "userName": "john_doe",
  "role": "user"
}
```

**Response (401 Unauthorized)** - if no valid token:
```json
{
  "message": "Unauthorized"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
interface MeResponse {
  id: number;
  email: string;
  userName: string;
  role: string;
}

meAPI(): Promise<MeResponse> {
  const res = await api.get("/auth/me");
  return res.data as MeResponse;
}
```

**Redux Action**:
```typescript
dispatch(fetchMeThunk())
```

**Usage**:
1. **App Bootstrap**: Called on app initialization to restore user session
2. **After Login**: Called after successful login to populate user state
3. **Session Verification**: Called to check if user still authenticated

**Frontend Bootstrap** (`app/providers.tsx`):
```typescript
function AuthBootstrap() {
  useEffect(() => {
    store.dispatch(fetchMeThunk());
  }, []);
  return null;
}
```

---

### POST /auth/logout

Clear user session and revoke token.

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Cookie: access_token=<jwt_token>
```

**Response (200 OK)**:
```json
{
  "message": "Logout successful"
}
```

**Frontend Call** (`authAPI.ts`):
```typescript
interface LogoutResponse {
  message: string;
}

logoutAPI(): Promise<LogoutResponse> {
  const res = await api.post("/auth/logout");
  return res.data as LogoutResponse;
}
```

**Redux Action**:
```typescript
export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async () => {
    try {
      await logoutAPI();
    } catch {
      // Clear auth state even if backend logout fails
    }
    return true;
  }
);
```

**Frontend Usage**:
```typescript
dispatch(logoutThunk());
// Auth state cleared, user redirected to home
```

---

## Authentication Flow Diagrams

### Signup & Email Verification

```
Frontend                          Backend
   |                                |
   |-- POST /auth/signup ---------->|
   |   SignupPayload               |
   |                                | Hash password
   |                                | Create user
   |                                | Generate OTP
   |                                | Send email
   |<-- Response + Email -----------|
   |   (OTP sent message)            |
   |                                |
   | User opens email, copies OTP    |
   |                                |
   |-- POST /auth/verify-email ---->|
   |   { email, code }              |
   |                                | Validate OTP
   |                                | Check expiration
   |                                | Mark verified
   |<-- Success Message ------------|
   |                                |
```

### Login Flow

```
Frontend                          Backend
   |                                |
   |-- POST /auth/login ----------->|
   |   { email, password }          |
   |                                | Find user
   |                                | Check verified
   |                                | Compare password
   |<-- Set-Cookie: access_token ---|
   |    (httpOnly, Secure)          |
   |                                |
   |-- GET /auth/me ----------------->|
   |   (Cookie sent automatically)   |
   |                                | Extract JWT
   |                                | Fetch user
   |<-- User Object-----------------|
   |   { id, email, userName, role } |
   |                                |
```

### Password Reset Flow

```
Frontend                          Backend
   |                                |
   |-- POST /auth/send-otp ------->|
   |   { email }                    |
   |                                | Find user
   |                                | Generate OTP
   |                                | Send email (5 min)
   |<-- OTP sent message ----------|
   |                                |
   | User receives email with OTP    |
   |                                |
   |-- POST /auth/verify-otp ------->|
   |   { email, otp }              |
   |                                | Validate OTP
   |                                | Check time limit
   |<-- OTP verified message -------|
   |                                |
   |-- POST /auth/reset-password -->|
   |   { email, newPassword, ... }   |
   |                                | Validate passwords
   |                                | Hash new password
   |                                | Update in DB
   |<-- Success Message ------------|
   |                                |
   | User can now login with new pwd |
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

**Common Status Codes**:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Login successful |
| 201 | Created | User signup created |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Invalid credentials, expired token |
| 409 | Conflict | Email already exists |
| 500 | Server Error | Database connection failed |

---

## CORS & Headers

### Request Headers (from Frontend)

```
Content-Type: application/json
Authorization: Bearer <jwt_token> (optional)
```

### Response Headers (from Backend)

```
Content-Type: application/json
Set-Cookie: access_token=<jwt_token>; HttpOnly; Secure; Path=/; SameSite=Lax
Access-Control-Allow-Origin: http://localhost:3001 (or configured FRONTEND_URL)
Access-Control-Allow-Credentials: true
```

### CORS Configuration

**Development**: All origins allowed
**Production**: Only FRONTEND_URL allowed

Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS

---

## Rate Limiting (Future)

Not currently implemented. Consider adding:
- Max 5 login attempts per 15 minutes
- Max 3 OTP sends per email per hour
- Max 10 password resets per 24 hours

---

## Related Documentation

- [Architecture - Backend](./architecture-backend.md)
- [Architecture - Frontend](./architecture-frontend.md)
- [Data Models](./data-models.md)
- [Integration Architecture](./integration-architecture.md)
