# Critical Implementation Rules

### Rule 1: TypeScript Configuration Differences

**Backend** (`backend/tsconfig.json`):
- ✅ `strictNullChecks: true` — enforced, must handle null/undefined explicitly
- ❌ `noImplicitAny: false` — allows implicit any (legacy decision)
- ✅ Decorators enabled: `emitDecoratorMetadata: true`, `experimentalDecorators: true`
- ✅ Remove comments in production: `removeComments: true`
- Target: ES2023, Module: nodenext

**Frontend** (`frontend/tsconfig.json`):
- ✅ `strict: true` — enforced globally, no bypassing
- ✅ Target: ES2017, Module: esnext
- ✅ Path alias configured: `@/*` maps to root directory
- ✅ JSX: react-jsx (automatic JSX transform)

**Implication**: AI agents must handle null-safety in backend but can't rely on implicit-any for quick prototyping.

### Rule 2: Module Organization Pattern (Backend)

NestJS modules are organized by feature with this structure:

```
modules/
├── auth/
│   ├── auth.module.ts        # @Module with controllers, services, imports
│   ├── auth.controller.ts    # @Controller with @Post/@Get routes
│   ├── auth.service.ts       # @Injectable business logic
│   ├── strategies/
│   │   └── jwt.strategies.ts # Passport strategy
│   └── dto/
│       ├── signup.dto.ts
│       ├── login.dto.ts
│       ├── verify-email.dto.ts
│       └── ...
├── users/
│   ├── user.module.ts
│   ├── user.service.ts       # Core CRUD & domain logic
│   └── entities/
│       └── user.entity.ts    # TypeORM entity with @Entity decorator
└── mail/
    ├── mail.module.ts
    └── mail.service.ts       # Email sending service
```

**Agent Rules**:
- Always place services in their own file with `@Injectable()` decorator
- DTOs go in `dto/` subdirectory with class-validator decorators
- Entity files go in `entities/` using TypeORM decorators
- Services are injected via constructor (constructor dependency injection)

### Rule 3: DTO & Validation Pattern

All backend input data uses Data Transfer Objects with class-validator:

```typescript
// PATTERN - All DTOs follow this:
import { IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export default class SignupDto {
  @IsNotEmpty({ message: 'User name should not be empty!' })
  userName: string;

  @IsNotEmpty({ message: 'Email should not be empty!' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  birthDate?: string;
}
```

**Agent Rules**:
- Always use decorators for validation, not inline checks
- Message strings on decorators are required (user-facing feedback)
- Optional fields use `@IsOptional()` + optional property syntax (`?`)
- Import class-validator decorators, never write custom validators
- Export as `default` class (not named export)

### Rule 4: Service Method Pattern

Services in backend follow this error-handling pattern:

```typescript
async signup(dto: SignupDto) {
  try {
    // Main logic
    const user = await this.userService.create({ ...dto, password });
    return { message: 'Success message', ...result };
  } catch (error) {
    // Explicit error type checking
    if (error instanceof QueryFailedError) {
      // Handle database errors specifically
      throw new ConflictException('User-friendly message');
    }
    throw error; // Re-throw unexpected errors
  }
}
```

**Agent Rules**:
- Services return objects with `{ message, data }` structure
- Always wrap database operations in try-catch
- Check for specific error types (QueryFailedError, etc.)
- Convert database errors to NestJS HTTP exceptions (UnauthorizedException, ConflictException, BadRequestException)
- Let unexpected errors bubble up (don't swallow them)

### Rule 5: React Component File Naming

Frontend components follow **PascalCase filenames** for components, **kebab-case directories** for routes:

```
frontend/
├── app/
│   ├── (auth)/login/
│   │   ├── page.tsx           # Route component
│   │   └── LoginForm.tsx      # Feature component (PascalCase)
│   ├── product/page.tsx       # Route page
├── components/
│   ├── Button.tsx             # Shared component
│   ├── inputs/
│   │   └── TextInput.tsx      # Grouped component
└── features/auth/
    └── components/
        └── LoginForm.tsx      # Feature-scoped component
```

**Agent Rules**:
- React components: **PascalCase.tsx** (e.g., `LoginForm.tsx`)
- Route directories: **kebab-case** (e.g., `forgot-password/`, `verify-email/`)
- Pages: **page.tsx** in route directories
- No default exports except page.tsx files — use named exports for components
- Test files named `*.test.tsx` or `*.spec.tsx`

### Rule 6: Redux State Management Pattern

Redux is configured with **Redux Toolkit** slices and thunks:

```typescript
// authSlice.ts - State shape
const initialState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// authThunk.ts - Async actions
export const loginThunk = createAsyncThunk('auth/login', async (dto) => {
  const response = await authAPI.login(dto);
  return response.data;
});

// Provider setup
<Provider store={store}>
  <Toaster ... />
  {children}
</Provider>
```

**Agent Rules**:
- Use Redux Thunk for async API calls (NOT saga, NOT query)
- Slices define reducers and state shape
- Thunks handle API calls and dispatch actions
- Connect to Redux via `useSelector` (read) and `useDispatch` (write)
- Store is configured in `store/store.ts` and wrapped in `app/providers.tsx`

### Rule 7: Prettier & Code Formatting

All code is formatted with Prettier using these settings:

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

**Agent Rules**:
- Use **single quotes** for strings (not double)
- Use **trailing commas** in multiline arrays/objects (not ES5-only)
- Both backend and frontend share the same Prettier config philosophy
- ESLint is configured alongside Prettier (no conflicts)

### Rule 8: Authentication Flow

The application uses **JWT + Email OTP verification** for authentication:

1. **Signup**: Email + password → Generate 6-digit OTP → Email sent
2. **Email Verification**: OTP code → Mark email as verified
3. **Login**: Email + password (must be verified first) → JWT token issued
4. **Password Reset**: Forgot password → UUID token → Email sent → Reset with new password

**Agent Rules**:
- OTP is 6-digit numeric string (generated: `Math.floor(100000 + Math.random() * 900000)`)
- OTP expires in 5 minutes (300,000 ms)
- Reset token uses UUID and expires in 1 hour
- Password hashing uses bcrypt with salt rounds = 10
- JWT payload: `{ sub: user.id, email: user.email }`
- Email verification is mandatory before login (not optional)

### Rule 9: API Endpoint Pattern

Backend API endpoints follow RESTful conventions:

```typescript
@Controller('auth')
export class AuthController {
  @Post('signup')    // POST /auth/signup
  signup(@Body() dto: SignupDto) { }

  @Post('login')     // POST /auth/login
  login(@Body() dto: LoginDto) { }

  @Post('verify-email')  // POST /auth/verify-email
  verifyEmail(@Body() dto: VerifyEmailDto) { }
}
```

**Agent Rules**:
- Use `@Post()` for creation/action, `@Get()` for retrieval
- Parameters are kebab-case in routes
- DTOs are validated automatically via NestJS pipes
- Response status codes follow HTTP conventions (200, 201, 400, 401, 409, etc.)
- Always return consistent response shape: `{ message?, token?, data? }`

### Rule 10: Error Handling Pattern (Frontend)

Frontend uses React Hot Toast for user feedback:

```typescript
try {
  const result = await dispatch(loginThunk(credentials)).unwrap();
  toast.success('Login successful');
} catch (error) {
  toast.error(error.message || 'Login failed');
}
```

**Agent Rules**:
- Use `toast.success()` for success messages
- Use `toast.error()` for error messages
- Toast duration is 3000ms by default
- Don't use `alert()` or `console.log()` for user feedback
- Toaster is configured in `app/providers.tsx` (already set up)

### Rule 11: Testing Convention

Jest is configured for both backend and frontend:

**Backend** (`backend/jest.config.js`):
- Root dir: `src/`
- Test pattern: `*.spec.ts` (not `.test.ts`)
- Environment: node

**Frontend**: Standard Jest configuration for React/TypeScript

**Agent Rules**:
- Backend test files: `*.spec.ts` (singular, specific)
- Frontend test files: `*.test.tsx` or `*.spec.tsx`
- Test location: Same directory as source file
- Use Jest matchers and mocking, NOT mocha/chai
- Setup test database/fixtures before assertions

### Rule 12: Environment Variables

Backend uses `.env` file loaded via `dotenv` package:

```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=...
DATABASE_NAME=ecommerce_db
JWT_SECRET=...
JWT_EXPIRES_IN=1d
MAIL_SERVICE=...
```

Frontend uses `.env.local` with `NEXT_PUBLIC_` prefix:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Agent Rules**:
- Never hardcode secrets or API URLs
- Backend reads from `.env` via ConfigModule
- Frontend uses `NEXT_PUBLIC_` prefix for client-side access
- Use `process.env.VARIABLE_NAME` to access variables
- Document all required env vars in `.env.example`

---
