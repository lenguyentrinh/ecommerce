# Integration Architecture - Frontend & Backend Communication

## Overview

The ecommerce application uses a distributed architecture with:
- **Frontend**: Next.js application running on port 3001
- **Backend**: NestJS API server running on port 3000
- **Communication**: HTTP REST API with JSON payloads
- **Authentication**: JWT tokens in httpOnly cookies

---

## Communication Flow

### Request/Response Cycle

```
Frontend (http://localhost:3001)
         ↓
    [Redux Action]
         ↓
    [Axios HTTP Client]
         ↓
         | HTTP Request (CORS enabled)
         |
         ↓ (http://localhost:3000)
Backend (NestJS)
         ↓
    [Controller Parsing]
         ↓
    [Service Processing]
         ↓
    [Database Operation]
         ↓
    [HTTP Response + Headers]
         |
         ↓ (Set-Cookie, CORS headers)
         |
Frontend [Store Update]
         ↓
    [Component Re-render]
         ↓
    [User sees updates]
```

---

## HTTP Client Configuration

### Axios Instance

**File**: `frontend/lib/axiosClient.ts`

```typescript
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,  // http://localhost:3000
  withCredentials: true,                      // Send cookies
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Configuration Details**:

1. **baseURL**: Backend API endpoint
   - Development: `http://localhost:3000`
   - Production: Configure via environment variable
   - Set in `frontend/.env.local`:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:3000
     ```

2. **withCredentials: true**
   - Sends cookies with every request
   - Allows httpOnly cookies to be sent automatically
   - Required for JWT authentication flow

3. **Content-Type**: JSON
   - All requests/responses use JSON format
   - Automatic serialization

### Authentication Headers

Token sent in two ways:

1. **HttpOnly Cookie** (preferred)
   ```
   Cookie: access_token=<jwt_token>
   ```
   - Set by backend after login
   - Automatically sent by Axios
   - Protected from XSS attacks

2. **Authorization Header** (fallback)
   ```
   Authorization: Bearer <jwt_token>
   ```
   - Can be manually set if needed
   - Extracted by Passport strategy

---

## Authentication Flow

### Signup Flow

```
Frontend                          Backend
   |                                |
   |-- POST /auth/signup ---------->|
   |   { userName, email,           |
   |     password, birthDate,        |
   |     phoneNumber }              |
   |                                |
   |<-- 200 + Email Notification ---|
   |    { message, email }          |
   |                                |
   | dispatch(signupThunk)          |
   | UPDATE: signupLoading = true   |
   |                                |
   | SUCCESS:                        |
   | signupLoading = false          |
   | NAVIGATE: /verify-email        |
   |                                |
```

**State Transitions**:
```javascript
// Before request
authState = {
  signupLoading: false,
  isAuthenticated: false,
  user: null
}

// During request
authState = {
  signupLoading: true,
  isAuthenticated: false,
  user: null
}

// After success
authState = {
  signupLoading: false,
  isAuthenticated: false,
  user: null
}
// User navigates to verify-email page
```

### Email Verification Flow

```
Frontend                          Backend
   |                                |
   | User receives OTP email        |
   |                                |
   |-- POST /auth/verify-email ---->|
   |   { email, code }              |
   |                                |
   |<-- 200 Success Message --------|
   |    { message, email }          |
   |                                |
   | dispatch(verifyEmailThunk)     |
   | UPDATE: verifyEmailLoading = true
   |                                |
   | SUCCESS:                        |
   | verifyEmailLoading = false     |
   | Email now verified on backend  |
   | NAVIGATE: /login               |
   |                                |
```

### Login Flow

```
Frontend                          Backend
   |                                |
   |-- POST /auth/login ----------->|
   |   { email, password }          |
   |                                | Find user
   |                                | Verify email verified
   |                                | Compare password hash
   |                                | Generate JWT
   |<-- Set-Cookie header ---------|
   |    access_token=<jwt_token>   |
   |    (httpOnly, Secure, SameSite)
   |<-- 200 Success Message --------|
   |    { message }                 |
   |                                |
   | dispatch(loginThunk):          |
   | 1. Call loginAPI()             |
   | 2. Then call meAPI()           |
   |                                |
   |-- GET /auth/me ----------------->|
   |    (Cookie sent auto)          |
   |                                | Extract JWT from cookie
   |                                | Validate signature
   |                                | Fetch user details
   |<-- User Object-----------------|
   |    { id, email, userName, role }
   |                                |
   | dispatch(loginThunk.fulfilled) |
   | UPDATE Redux State:             |
   |   isAuthenticated = true       |
   |   user = { id, email, ... }    |
   | NAVIGATE: /dashboard           |
   |                                |
```

**Redux State After Login**:
```javascript
authState = {
  user: {
    id: 1,
    email: "john@example.com",
    userName: "john_doe",
    role: "user"
  },
  isAuthenticated: true,
  loginLoading: false,
  meLoading: false
}
```

### Session Restoration (App Bootstrap)

```
Frontend                          Backend
   |                                |
   | App loads (providers.tsx)      |
   | AuthBootstrap effect triggers  |
   |                                |
   |-- GET /auth/me ----------------->|
   |    (Cookie auto-sent if exists)|
   |                                |
   |                                | If no valid token:
   |                                | Return 401 Unauthorized
   |<-- 401 Unauthorized ------------|
   |                                |
   | dispatch(fetchMeThunk.rejected)|
   | isAuthenticated = false        |
   | user = null                    |
   | User sees login prompt         |
   |                                |
   | OR if token valid:             |
   |                                | Validate token
   |                                | Fetch user
   |<-- User Object-----------------|
   |                                |
   | dispatch(fetchMeThunk.fulfilled)
   | isAuthenticated = true         |
   | user = { ... }                 |
   | User sees authenticated UI     |
   |                                |
```

### Password Reset Flow

```
Frontend                          Backend
   |                                |
   |-- POST /auth/send-otp ------->|
   |   { email }                    |
   |                                | Generate OTP
   |                                | Save OTP (5 min expiry)
   |                                | Send email
   |<-- Success Message ------------|
   |    { message, email }          |
   |                                |
   | User receives OTP email        |
   |                                |
   |-- POST /auth/verify-otp ------->|
   |   { email, otp }              |
   |                                | Validate OTP
   |                                | Check not expired
   |<-- OTP Verified Message -------|
   |    { message, email }          |
   |                                |
   |-- POST /auth/reset-password -->|
   |   { email, newPassword,        |
   |     confirmNewPassword }       |
   |                                | Validate passwords
   |                                | Hash password
   |                                | Update in DB
   |<-- Success Message ------------|
   |    { message, email }          |
   |                                |
   | User can now login with        |
   | new password                   |
   |                                |
```

---

## CORS Configuration

### Backend CORS Setup

**File**: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : true,  // Allow all in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

**Behavior**:

| Environment | Origin | Purpose |
|-------------|--------|---------|
| Development | `*` (all) | Flexible testing |
| Production | `FRONTEND_URL` | Security/prevent CSRF |

**Methods Allowed**:
- GET - Fetch data
- POST - Create/auth operations
- PUT - Full updates (future)
- DELETE - Delete resources (future)
- PATCH - Partial updates (future)
- OPTIONS - CORS preflight

**Headers Allowed**:
- Content-Type - JSON data
- Authorization - Bearer token (fallback)

### Preflight Requests

Browser sends OPTIONS request for non-simple requests:

```
Frontend                          Backend
   |                                |
   |-- OPTIONS /auth/login ------->|
   |   (Browser preflight)          |
   |                                |
   |<-- 200 OK + CORS headers ------|
   |    Access-Control-Allow-*      |
   |                                |
   |-- POST /auth/login ----------->|
   |   (Actual request)             |
   |                                |
```

---

## State Synchronization

### Redux Store Structure

```javascript
store.getState() = {
  auth: {
    user: {
      id: number,
      email: string,
      userName: string,
      role: string
    } | null,
    isAuthenticated: boolean,
    signupLoading: boolean,
    loginLoading: boolean,
    verifyEmailLoading: boolean,
    meLoading: boolean,
    sendOtpLoading: boolean,
    verifyOtpLoading: boolean,
    resetPasswordLoading: boolean
  }
}
```

### State Update Triggers

**Thunk Actions**:

1. `signupThunk` - Creates user account
2. `loginThunk` - Authenticates user
3. `fetchMeThunk` - Restores user session
4. `verifyEmailThunk` - Marks email verified
5. `logoutThunk` - Clears auth state
6. `sendOtpThunk` - Sends OTP email
7. `verifyOtpThunk` - Validates OTP
8. `resetPasswordThunk` - Updates password

Each thunk dispatches:
- **pending** action → Set loading = true
- **fulfilled** action → Update state with response
- **rejected** action → Clear state, set loading = false

---

## Error Handling Strategy

### Backend Error Responses

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Frontend Error Handling

**In Thunks**:

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error: any) {
  return rejectWithValue(
    error.response?.data?.message || 'Operation failed'
  );
}
```

**In Components**:

```typescript
const result = await dispatch(loginThunk(data));

if (result.type.endsWith('/fulfilled')) {
  // Success
  toast.success('Login successful');
  navigate('/dashboard');
} else {
  // Error
  const error = result.payload;
  toast.error(error || 'Login failed');
}
```

### Error Types

| Error | Code | Action |
|-------|------|--------|
| Invalid credentials | 401 | Show error toast, stay on form |
| Email not verified | 401 | Redirect to verify-email |
| Email exists | 409 | Show error toast, suggest login |
| Password too short | 400 | Show validation error on field |
| Network error | NETWORK | Show error toast with retry option |

---

## Token Lifecycle

### Token Generation

```
User Signup
  ↓
User Verifies Email
  ↓
User Login
  ↓
Backend: Generate JWT { sub: userId, email: userEmail }
  ↓
Backend: Set HttpOnly Cookie with token
  ↓
Cookie: access_token=<jwt_token>; HttpOnly; Secure; Path=/; Max-Age=86400
```

### Token Validation

```
Frontend: Sends request with cookie
  ↓
Backend: Extracts token from cookie
  ↓
Backend: Verifies signature using JWT_SECRET
  ↓
Backend: Extracts payload { sub, email }
  ↓
Backend: Fetches user from database
  ↓
Backend: Attaches user to request
  ↓
Allowed to proceed / Return 401 if invalid
```

### Token Expiration

- **Duration**: 1 day (configurable via JWT_EXPIRES_IN)
- **On Expiration**: User receives 401 on next request
- **Frontend Action**: Clear auth state, redirect to login
- **Refresh**: Not implemented, user must login again

### Token Revocation

- **Logout**: Frontend clears state immediately
- **Backend**: Can optionally invalidate token
- **Cookie**: Cleared by frontend (token left in cookie for cleanup)

---

## Environment Configuration

### Frontend Environment Variables

**File**: `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Used by**: Axios client baseURL configuration

### Backend Environment Variables

**File**: `backend/.env`

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=ecommerce

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3001
```

---

## Development vs Production

### Development

```
Frontend: http://localhost:3001 (Next.js dev server)
Backend: http://localhost:3000 (NestJS dev server)
CORS: All origins allowed
JWT: Not validated for expiration
Database: Auto-sync enabled
```

### Production

```
Frontend: https://yourdomain.com (served by CDN/Node.js)
Backend: https://api.yourdomain.com (behind reverse proxy)
CORS: Only FRONTEND_URL allowed
JWT: Validated and enforced
Database: Manual migrations
SSL: Required
```

---

## Monitoring & Debugging

### API Request Logging

**Frontend**: Check browser DevTools Network tab
```
POST http://localhost:3000/auth/login
Headers: Content-Type: application/json
Cookies: access_token=...
Response: 200 { message: "Login successful" }
```

### Backend Request Logging

**NestJS**: Configure logging in main.ts
```typescript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### State Debugging

**Redux DevTools** (optional integration):
```typescript
// In store.ts
import { devtools } from '@redux-devtools/extension';

export const store = configureStore({
  reducer: { auth: authReducer },
  devtools: true
});
```

---

## Security Considerations

### HTTPS/TLS

**Production**:
- All requests over HTTPS
- Browser enforces HSTS
- Set `Secure` flag on cookies

### Cookie Security

**HttpOnly Flag**:
- Prevents JavaScript access
- Mitigates XSS attacks

**SameSite Flag**:
- Prevents CSRF attacks
- Set to `Lax` (default) or `Strict`

**Secure Flag**:
- Only sent over HTTPS
- Enabled in production

### CORS Security

**Development**: Allow all (ease of testing)
**Production**: Whitelist specific origin only

### Input Validation

1. **Frontend**: React Hook Form validation
2. **Backend**: Class-validator DTOs
3. **Database**: Unique constraints, type checking

### Rate Limiting

**Not yet implemented**, consider:
- Max 5 login attempts per 15 minutes
- Max 3 password resets per 24 hours
- Max 10 OTP sends per hour

---

## Troubleshooting

### Common Issues

**Issue**: CORS error when calling backend
**Solution**: 
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is running on expected port
- Check CORS configuration in backend

**Issue**: JWT token not being sent
**Solution**:
- Verify `withCredentials: true` in Axios
- Check cookie being set in response headers
- Check cookie domain/path matches

**Issue**: Unauthorized after login
**Solution**:
- Check JWT_SECRET matches frontend expectations
- Verify token expiration time
- Check database has user record
- Look at backend logs for validation errors

---

## Related Documentation

- [API Contracts](./api-contracts.md)
- [Architecture - Backend](./architecture-backend.md)
- [Architecture - Frontend](./architecture-frontend.md)
- [Data Models](./data-models.md)
