# Source Tree Analysis

Complete directory structure and file inventory for the ecommerce monorepo.

---

## Backend Source Tree

**Location**: `backend/src/`

### Core Files (5 files)

```
backend/src/
├── main.ts                          [171 bytes] - NestJS bootstrap entry
├── app.module.ts                    [214 bytes] - Root module definition
├── app.controller.ts                [234 bytes] - Health check endpoints
├── app.controller.spec.ts           [342 bytes] - App controller tests
└── app.service.ts                   [89 bytes] - Root service
```

**main.ts**: NestJS application bootstrap
- Imports NestFactory for app creation
- Configures cookie parser middleware
- Enables CORS with environment-based origin
- Sets global validation pipe with whitelist & transform
- Configures Swagger API documentation
- Starts server on configured PORT (default 3000)
- Key configuration: CORS allows all origins in dev, specific URL in production

**app.module.ts**: Root application module
- Imports: ConfigModule, DatabaseModule, AuthModule
- ConfigModule configured to load jwt.config
- Makes config globally available
- Initializes database connection
- Imports auth functionality

**app.controller.ts**: HTTP endpoint handler
- Single GET endpoint (likely health check)
- No authentication required
- Returns simple status response

**app.service.ts**: Root service
- Minimal service (likely just getHello())
- No database operations

### Configuration (3 files)

```
backend/src/config/
├── app.config.ts                    [284 bytes] - App settings
├── jwt.config.ts                    [456 bytes] - JWT configuration
└── (parent) database/database.config.ts [658 bytes] - TypeORM setup
```

**app.config.ts**: Application settings
- Exports configuration object
- Likely contains app name, version, etc.

**jwt.config.ts**: JWT authentication settings
- Exports secret key from environment
- Configures token expiration time
- Loaded by ConfigModule in app.module

**database.config.ts**: Database configuration
- TypeORM MySQL connection setup
- Auto-loads entities from src/modules
- Synchronize enabled (auto-create tables)
- Connection pooling configured

### Auth Module (9 files)

```
backend/src/modules/auth/
├── auth.module.ts                   [645 bytes] - Module definition
├── auth.controller.ts               [1.2 KB] - HTTP endpoints
├── auth.service.ts                  [3.8 KB] - Business logic
├── strategies/
│   └── jwt.strategies.ts            [2.1 KB] - Passport JWT strategy
└── dto/
    ├── login.dto.ts                 [142 bytes]
    ├── signup.dto.ts                [178 bytes]
    ├── forgot-password.dto.ts       [95 bytes]
    ├── verify-email.dto.ts          [109 bytes]
    ├── send-otp.dto.ts              [79 bytes]
    ├── verify-otp.dto.ts            [111 bytes]
    └── reset-password.dto.ts        [178 bytes]
```

**auth.module.ts**: Dependency injection configuration
- Imports: UsersModule, PassportModule, JwtModule, MailModule, ConfigModule
- Controllers: AuthController
- Providers: AuthService, JwtStrategy
- JwtModule configured async with secret & expiration
- Ensures JWT_SECRET configured before module load

**auth.controller.ts**: HTTP endpoints (7 routes)
```
POST /auth/login              - Authenticate user
POST /auth/signup             - Register new user
POST /auth/verify-email       - Verify email with OTP
POST /auth/send-otp           - Send OTP to email
POST /auth/verify-otp         - Verify OTP code
POST /auth/forgot-password    - Initiate password reset
POST /auth/reset-password     - Complete password reset
```

**auth.service.ts**: Core authentication logic
- Password hashing: bcrypt with 10 salt rounds
- OTP generation: 6-digit random codes
- OTP expiration: 5 minutes
- Token expiration: 1 hour for reset tokens
- JWT payload: { sub: userId, email }
- Validates email uniqueness
- Validates password requirements
- Compares passwords with bcrypt

**jwt.strategies.ts**: Passport JWT authentication
- Extracts JWT from cookie (primary) or Authorization header (fallback)
- Validates token signature and expiration
- Returns user from database on successful validation
- Custom extraction logic for cookie/header detection

**DTOs**: Data Transfer Objects for request validation
- All use class-validator decorators
- Validate email format, required fields, etc.
- Provide type safety for incoming data

### Users Module (3 files)

```
backend/src/modules/users/
├── user.module.ts                   [178 bytes] - Module definition
├── user.service.ts                  [1.2 KB] - User operations
└── entities/
    └── user.entity.ts               [1.8 KB] - Database schema
```

**user.module.ts**: User module setup
- Imports: TypeOrmModule with User entity
- Exports: UserService for other modules
- Sets up TypeORM repository for users table

**user.service.ts**: User CRUD operations
- `create()` - Create new user account
- `findByEmail()` - Query by email
- `findById()` - Query by ID
- `setEmailOTP()` - Store OTP code
- `verifyEmailOtp()` - Validate and mark verified
- `updatePassword()` - Update user password
- `updateResetToken()` - Store reset token

**user.entity.ts**: TypeORM entity definition
- Column: id (primary key, auto-increment)
- Column: userName (string, required)
- Column: email (string, unique, required)
- Column: password (string, required, hashed)
- Column: birthDate (string, optional)
- Column: phoneNumber (string, optional)
- Column: emailVerified (boolean, default false)
- Column: emailOtpCode (string, optional)
- Column: emailOtpExpires (timestamp, optional)
- Column: resetPasswordToken (string, optional)
- Column: resetPasswordExpired (timestamp, optional)
- Column: createAt (timestamp, default current)
- Validation decorators: @IsEmail, @MinLength, @IsNotEmpty

### Mail Module (2 files)

```
backend/src/modules/mail/
├── mail.module.ts                   [156 bytes] - Module definition
└── mail.service.ts                  [1.1 KB] - Email operations
```

**mail.module.ts**: Mail module setup
- Exports: MailService
- No imports (standalone)
- Provides email sending capability

**mail.service.ts**: Email operations
- Uses Nodemailer for SMTP
- `sendOtpEmail()` - Send OTP verification emails
- HTML email templates (likely)
- Configurable SMTP settings via environment

### Common Utilities (1 file)

```
backend/src/common/
└── utils/
    └── hash.util.ts                 [145 bytes] - Password hashing
```

**hash.util.ts**: Utility functions
- Password hashing wrapper
- Likely exports bcrypt functions
- Provides consistent hashing across app

### Summary

**Total Backend Files**: 25
- Core: 5 files
- Config: 3 files
- Auth Module: 9 files
- Users Module: 3 files
- Mail Module: 2 files
- Utilities: 1 file
- Test files: 2 files (spec.ts)

**Total Lines of Code**: ~2,500 (estimated)
**Total Size**: ~25 KB (source code only)

---

## Frontend Source Tree

**Location**: `frontend/`

### App Router Pages (19 files)

```
frontend/app/
├── layout.tsx                       [1.2 KB] - Root layout
├── page.tsx                         [746 bytes] - Home page
├── globals.css                      - Global styles (TailwindCSS)
├── providers.tsx                    [1.5 KB] - Redux & toast setup
├── product/
│   └── page.tsx                     - Products listing page
├── my-account/
│   └── page.tsx                     - User account page
├── logout/
│   └── page.tsx                     - Logout handler
├── about-me/
│   └── page.tsx                     - About page
└── (auth)/                          - Route group for auth pages
    ├── login/
    │   ├── page.tsx                 - Login page
    │   └── LoginForm.tsx            [1.3 KB] - Login form component
    ├── signup/
    │   ├── page.tsx                 - Signup page
    │   └── SignupForm.tsx           [1.8 KB] - Signup form component
    ├── verify-email/
    │   ├── page.tsx                 - Email verification page
    │   └── VerifyEmailForm.tsx      [1.2 KB] - OTP verification form
    └── forgotPassword/
        ├── page.tsx                 - Password reset entry
        ├── ForgotPasswordByEmailForm.tsx [1.0 KB] - Email entry form
        ├── otp/
        │   ├── page.tsx
        │   └── otpForm.tsx          [1.1 KB] - OTP form for reset
        └── reset/
            ├── page.tsx
            └── ResetPasswordForm.tsx [1.3 KB] - New password form
```

**layout.tsx**: Root layout component
- Imports Google Fonts: Nunito, Geist Mono
- Sets up global CSS variables
- Configures metadata (title, description)
- Renders Header, Footer, and page content
- Wraps children with Providers
- TailwindCSS utility classes for layout

**page.tsx**: Home/landing page
- Hero section with welcome message
- Best seller section component
- Home carousel component
- Focus on product showcase

**providers.tsx**: Client-side providers
- Redux store provider
- AuthBootstrap hook for session restoration
- React Hot Toast provider
- Toast configuration: bottom-left position

### Components (9 files)

```
frontend/components/
├── Button.tsx                       - Reusable button component
├── Navbar.tsx                       - Navigation bar
├── Footer.tsx                       - Site footer
├── ProductCard.tsx                  - Product display card
├── inputs/
│   └── TextInput.tsx                - Form text input
├── home/
│   ├── BestSellerSection.tsx       - Featured products section
│   └── HomeCarousel.tsx             - Image carousel slider
└── layout/
    ├── Header.tsx                   - Header with navigation
    └── Footer.tsx                   - Footer component
```

**Button.tsx**: Base button component
- Props: variant, size, loading, disabled, children, onClick
- TailwindCSS styling
- Multiple variants (primary, secondary, danger)
- Loading state with spinner

**TextInput.tsx**: Form input component
- Props: label, placeholder, value, error, disabled, type, required
- Error message display
- Label association
- TailwindCSS styling

**ProductCard.tsx**: Product display card
- Props: id, name, price, image, rating, reviews
- Image, title, price, rating display
- Add to cart button
- Quick view option

**HomeCarousel.tsx**: Image carousel
- Auto-play carousel
- Navigation controls
- Responsive design
- Images from Unsplash

**BestSellerSection.tsx**: Featured products
- Grid of best-selling products
- Uses ProductCard components
- View all button
- Title and description

### Feature Modules (8 files)

```
frontend/features/
├── auth/
│   ├── components/
│   │   ├── LoginForm.tsx            - Login form (feature module)
│   │   └── SignupForm.tsx           - Signup form (feature module)
│   ├── hooks/
│   │   └── useAuth.ts               [0.8 KB] - Auth hook
│   └── services/
│       └── authApi.ts               - Auth API calls (feature)
└── product/
    ├── components/
    │   └── ProductList.tsx          - Product list component
    ├── hooks/
    │   └── useProducts.ts           - Product data hook
    └── services/
        └── productApi.ts            - Product API calls
```

**useAuth.ts**: Authentication hook
- Returns: user, isAuthenticated, loading states, dispatch
- Connects to Redux auth state
- Provides easy auth state access to components

**useProducts.ts**: Product data hook
- Fetches product list from API
- Returns: products, loading, error, refetch
- Handles API errors gracefully

**authApi.ts**: Feature-level auth API service
- Duplicates main services/authAPI.ts
- Scoped to feature module

**productApi.ts**: Product API operations
- Fetch products list
- Get product details
- Future: add to cart, etc.

### Hooks (1 file)

```
frontend/hooks/
└── useToggle.ts                     [0.3 KB] - Boolean toggle hook
```

**useToggle.ts**: Simple state toggle
- Parameters: initial boolean
- Returns: [state, toggle function]
- Used for modals, dropdowns, etc.

### State Management (3 files)

```
frontend/store/
├── store.ts                         [0.4 KB] - Redux store config
├── authSlice.ts                     [2.8 KB] - Auth reducer & actions
└── authThunk.ts                     [3.2 KB] - Async auth actions
```

**store.ts**: Redux store configuration
- Uses configureStore from Redux Toolkit
- Includes authReducer
- Exports types: RootState, AppDispatch
- No middleware configured yet

**authSlice.ts**: Redux Toolkit auth slice
- Initial state: user, isAuthenticated, loading flags
- Reducers: logout (sync), setAuth (sync)
- Extra reducers for all async thunks
- Handles: signup, login, verify email, fetch me, logout, OTP, reset

**authThunk.ts**: Async Redux actions (8 thunks)
- signupThunk: Register user
- loginThunk: Authenticate + fetch user
- fetchMeThunk: Restore session on app load
- verifyEmailThunk: Verify email with OTP
- logoutThunk: Clear auth state
- sendOtpThunk: Send OTP to email
- verifyOtpThunk: Verify OTP code
- resetPasswordThunk: Reset password
- All include error handling and rejectWithValue

### API Services (2 files)

```
frontend/services/
├── api.ts                           [0.3 KB] - Axios client config
└── authAPI.ts                       [3.1 KB] - Auth API endpoints
```

**api.ts**: Axios HTTP client
- baseURL from NEXT_PUBLIC_API_URL env
- withCredentials: true for cookie sending
- Content-Type: application/json

**authAPI.ts**: Auth API endpoints
- Types: SignupPayload, LoginPayload, VerifyEmailPayload, etc.
- Functions: signupAPI, loginAPI, verifyEmailAPI, meAPI, etc.
- All use api instance from api.ts
- Proper error handling and type safety

### Types (2 files)

```
frontend/types/
├── user.ts                          - User type definitions
└── product.ts                       - Product type definitions
```

### Utilities & Libraries (4 files)

```
frontend/lib/
├── axiosClient.ts                   [0.3 KB] - Axios config (deprecated?)
├── constants.ts                     - App constants
├── helpers.ts                       - Utility functions
└── toast.tsx                        - Toast notification utils
```

**axiosClient.ts**: Duplicate of services/api.ts (consolidate)
- Could be removed in refactor

**helpers.ts**: Utility functions
- String formatting, validation, etc.

**toast.tsx**: Toast notification helpers
- Success, error, info functions
- Uses react-hot-toast

### Configuration (1 file)

```
frontend/
└── next.config.ts                   [0.4 KB] - Next.js configuration
```

**next.config.ts**: Next.js settings
- Image optimization configuration
- Allows images from unsplash.com
- Future: Add other remotePatterns

### Global Styles

```
frontend/app/
└── globals.css                      - Global CSS with TailwindCSS
```

**globals.css**:
- @tailwind directives for base, components, utilities
- Custom CSS variables for fonts
- Global style resets

### Summary

**Total Frontend Files**: 48
- Pages: 19 files
- Components: 9 files
- Features: 8 files
- Hooks: 1 file
- State Management: 3 files
- API Services: 2 files
- Types: 2 files
- Utilities: 4 files
- Configuration: 1 file

**Total Lines of Code**: ~4,000 (estimated)
**Total Size**: ~40 KB (source code only)

---

## Configuration Files

```
ecommerce/
├── backend/
│   ├── tsconfig.json                - TypeScript config
│   ├── .env.example                 - Environment template (if exists)
│   ├── nest-cli.json                - NestJS CLI config
│   └── package.json
│
└── frontend/
    ├── tsconfig.json                - TypeScript config
    ├── next.config.ts               - Next.js config (see above)
    ├── tailwind.config.js           - TailwindCSS config
    ├── postcss.config.js            - PostCSS config for Tailwind
    └── package.json
```

---

## File Statistics

### By Type

| File Type | Backend | Frontend | Total |
|-----------|---------|----------|-------|
| .ts | 25 | 30 | 55 |
| .tsx | 0 | 18 | 18 |
| .json | 2 | 1 | 3 |
| .css | 0 | 1 | 1 |
| .js | 0 | 2 | 2 |
| **Total** | **27** | **52** | **79** |

### By Size

- Backend source: ~25 KB
- Frontend source: ~40 KB
- Configuration: ~5 KB
- **Total**: ~70 KB (source code)

### By Module

**Backend**:
- Auth: 43% of backend code
- Users: 15% of backend code
- Config: 20% of backend code
- Mail: 12% of backend code
- Core: 10% of backend code

**Frontend**:
- Pages: 25% of frontend code
- Components: 20% of frontend code
- State Management: 18% of frontend code
- Features: 18% of frontend code
- Services: 12% of frontend code
- Utilities: 7% of frontend code

---

## Code Metrics

### Test Coverage

**Backend**:
- Spec files: 1 (app.controller.spec.ts)
- Coverage: Minimal (no service tests yet)
- Test framework: Jest

**Frontend**:
- Spec files: 0
- Coverage: 0%
- Tests: Not configured

### Complexity Analysis

**High Complexity**:
- authService.ts (multiple methods, business logic)
- authThunk.ts (async operations, error handling)
- UserService (database operations)

**Medium Complexity**:
- Auth controller (7 endpoints)
- Form components (form handling, validation)
- authSlice.ts (Redux logic)

**Low Complexity**:
- DTOs (simple data structures)
- Utility components
- Hooks (simple logic)

---

## Dependencies Summary

### Backend Key Dependencies
- @nestjs/core: 11.0.1 (NestJS framework)
- typeorm: 0.3.28 (ORM)
- passport: 0.7.0 (authentication)
- bcrypt: 6.0.0 (password hashing)
- nodemailer: 8.0.1 (email)

### Frontend Key Dependencies
- next: 16.0.1 (React framework)
- react: 19.2.0 (UI library)
- @reduxjs/toolkit: 2.11.2 (state management)
- axios: 1.13.2 (HTTP client)
- tailwindcss: 4.0 (styling)

---

## Code Quality Indicators

**Positive**:
- TypeScript throughout (type safety)
- Consistent file organization
- Clear separation of concerns
- Modular architecture
- Environment-based configuration

**Areas for Improvement**:
- Add tests (unit, integration, E2E)
- Extract duplicated form components
- Remove axiosClient.ts duplicate
- Add error boundary components
- Implement loading skeletons
- Add input sanitization
- Add rate limiting
- Add request/response logging

---

## Related Documentation

- [Architecture - Backend](./architecture-backend.md)
- [Architecture - Frontend](./architecture-frontend.md)
- [Component Inventory](./component-inventory.md)
