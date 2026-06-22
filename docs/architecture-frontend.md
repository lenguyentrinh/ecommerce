# Frontend Architecture - Next.js React Application

## Overview

The frontend is a Next.js 16 React application with TypeScript, Redux Toolkit for state management, and TailwindCSS for styling. It provides a user interface for product browsing and authentication.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                   UI Components Layer                            │
│            (React Components - User Interface)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              State Management Layer                              │
│        (Redux Toolkit - Global Application State)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               API Integration Layer                              │
│           (Axios - HTTP Communication)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                NestJS Backend API                               │
│             (REST Endpoints - Data Source)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Application Structure

### Directory Organization

```
frontend/
├── app/                      # Next.js App Router (pages)
├── components/               # Reusable UI components
├── features/                 # Feature modules (auth, product)
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and helpers
├── store/                    # Redux state management
├── services/                 # API services (HTTP calls)
├── types/                    # TypeScript type definitions
└── next.config.ts           # Next.js configuration
```

## Pages & Routing

### Next.js App Router

Using Next.js 13+ App Router for file-based routing.

#### Auth Routes (Route Group)

**Location**: `frontend/app/(auth)/`

Route group `(auth)` organizes auth-related pages without adding to URL path.

**Pages**:

1. **Login** - `app/(auth)/login/page.tsx`
   - Email/password login form
   - Component: `LoginForm.tsx`
   - Uses `loginThunk` async action

2. **Signup** - `app/(auth)/signup/page.tsx`
   - User registration form
   - Component: `SignupForm.tsx`
   - Collects: userName, email, password, birthDate, phoneNumber
   - Uses `signupThunk` async action

3. **Verify Email** - `app/(auth)/verify-email/page.tsx`
   - OTP verification form
   - Component: `VerifyEmailForm.tsx`
   - Verifies email with OTP code
   - Uses `verifyEmailThunk` async action

4. **Forgot Password** - `app/(auth)/forgotPassword/page.tsx`
   - Email entry for password reset
   - Component: `ForgotPasswordByEmailForm.tsx`
   - Initiates reset flow

5. **Forgot Password OTP** - `app/(auth)/forgotPassword/otp/page.tsx`
   - OTP verification for password reset
   - Component: `otpForm.tsx`
   - Uses `sendOtpThunk` and `verifyOtpThunk`

6. **Reset Password** - `app/(auth)/forgotPassword/reset/page.tsx`
   - New password entry form
   - Component: `ResetPasswordForm.tsx`
   - Uses `resetPasswordThunk` async action

#### Public Routes

1. **Home** - `app/page.tsx`
   - Landing page with product showcase
   - Components: `HomeCarousel`, `BestSellerSection`
   - Welcome section with site description

2. **Products** - `app/product/page.tsx`
   - Product listing/browsing
   - Component: `ProductList.tsx`

#### Authenticated Routes

1. **My Account** - `app/my-account/page.tsx`
   - User profile and settings
   - Requires authentication

2. **About Me** - `app/about-me/page.tsx`
   - User information page

3. **Logout** - `app/logout/page.tsx`
   - Logout handler
   - Uses `logoutThunk` to clear auth state

### Root Layout

**File**: `frontend/app/layout.tsx`

Main layout wrapping all pages:

**Structure**:
```
<html>
  <body>
    <Providers>                    # Redux + Toast providers
      <Header />                   # Navigation bar
      {children}                   # Page content
      <Footer />                   # Site footer
    </Providers>
  </body>
</html>
```

**Features**:
- Google Fonts: Nunito (main), Geist Mono (mono)
- Global CSS: `globals.css`
- Metadata: Title "FE Ecommerce", description for SEO
- TailwindCSS utilities (bg-slate-50, min-h-screen, etc.)

### Providers Component

**File**: `frontend/app/providers.tsx`

Client-side provider setup:

```typescript
export default function Providers({ children }) {
  return (
    <Provider store={store}>           # Redux store
      <AuthBootstrap />                # Init auth state
      {children}
      <Toaster />                      # Toast notifications
    </Provider>
  );
}
```

**AuthBootstrap Hook**:
- On app mount, dispatches `fetchMeThunk`
- Restores user session from backend
- Populates auth state if token exists

## State Management

### Redux Store Configuration

**File**: `frontend/store/store.ts`

```typescript
export const store = configureStore({
  reducer: {
    auth: authReducer,   # Auth slice reducer
  },
});
```

**State Shape**:
```typescript
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    signupLoading: boolean,
    loginLoading: boolean,
    verifyEmailLoading: boolean,
    meLoading: boolean,
    sendOtpLoading: boolean,
    verifyOtpLoading: boolean,
    resetPasswordLoading: boolean,
  }
}
```

### Auth Slice

**File**: `frontend/store/authSlice.ts`

Redux Toolkit slice managing authentication state:

**User Interface**:
```typescript
interface User {
  id: number;
  email: string;
  userName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  signupLoading: boolean;
  loginLoading: boolean;
  verifyEmailLoading: boolean;
  meLoading: boolean;
  sendOtpLoading: boolean;
  verifyOtpLoading: boolean;
  resetPasswordLoading: boolean;
}
```

**Reducers** (synchronous actions):

1. **logout**
   - Sets `isAuthenticated = false`
   - Clears user data (`user = null`)

2. **setAuth**
   - Sets `isAuthenticated = true`
   - Stores user object

**Extra Reducers** (async thunk handlers):

Each thunk has 3 states:
- `pending` - Set loading to true
- `fulfilled` - Set loading to false, update state
- `rejected` - Set loading to false, clear state

### Auth Async Thunks

**File**: `frontend/store/authThunk.ts`

Redux Thunk async actions for API calls:

1. **signupThunk**
   - Calls `signupAPI(data)`
   - Payload: SignupPayload
   - Error handling: Returns error message

2. **loginThunk**
   - Calls `loginAPI(data)`
   - Then calls `meAPI()` to fetch current user
   - Updates auth state with user info
   - Payload: LoginPayload
   - Returns: User object

3. **fetchMeThunk**
   - Calls `meAPI()` to restore user session
   - Used on app bootstrap
   - Returns current user if authenticated

4. **verifyEmailThunk**
   - Calls `verifyEmailAPI(data)`
   - Payload: VerifyEmailPayload (email, code)

5. **logoutThunk**
   - Calls `logoutAPI()`
   - Clears auth state regardless of backend response

6. **sendOtpThunk**
   - Calls `sendOtpAPI(data)`
   - Payload: SendOtpPayload (email)

7. **verifyOtpThunk**
   - Calls `verifyOtpAPI(data)`
   - Payload: VerifyOtpPayload (email, otp)

8. **resetPasswordThunk**
   - Calls `resetPasswordAPI(data)`
   - Payload: ResetPasswordPayload (email, newPassword, confirmNewPassword)

## HTTP Client & API Integration

### Axios Client Configuration

**File**: `frontend/lib/axiosClient.ts`

Base Axios instance for all API requests:

```typescript
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,  // Backend URL
  withCredentials: true,                      # Send cookies
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Configuration**:
- Base URL from environment variable `NEXT_PUBLIC_API_URL`
- Credentials enabled (sends cookies for JWT storage)
- JSON content type
- Environment: `NEXT_PUBLIC_API_URL=http://localhost:3000`

### Auth API Service

**File**: `frontend/services/authAPI.ts`

HTTP API calls for authentication:

**Type Definitions**:

```typescript
interface SignupPayload {
  userName: string;
  email: string;
  password: string;
  birthDate: string;
  phoneNumber: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface VerifyEmailPayload {
  email: string | null;
  code: string;
}

interface SendOtpPayload {
  email: string;
}

interface VerifyOtpPayload {
  email: string;
  otp: string;
}

interface ResetPasswordPayload {
  email: string;
  newPassword: string;
  confirmNewPassword: string | null;
}

interface MeResponse {
  id: number;
  email: string;
  userName: string;
  role: string;
}
```

**API Functions**:

```typescript
// POST /auth/signup
signupAPI(data: SignupPayload): Promise<any>

// POST /auth/login
loginAPI(data: LoginPayload): Promise<{ message: string }>

// POST /auth/verify-email
verifyEmailAPI(data: VerifyEmailPayload): Promise<any>

// GET /auth/me
meAPI(): Promise<MeResponse>

// POST /auth/logout
logoutAPI(): Promise<{ message: string }>

// POST /auth/send-otp
sendOtpAPI(data: SendOtpPayload): Promise<any>

// POST /auth/verify-otp
verifyOtpAPI(data: VerifyOtpPayload): Promise<any>

// POST /auth/reset-password
resetPasswordAPI(data: ResetPasswordPayload): Promise<any>
```

## Components

### Layout Components

**Header** - `frontend/components/layout/Header.tsx`
- Navigation bar
- Logo/branding
- Navigation links
- User menu (if authenticated)

**Footer** - `frontend/components/layout/Footer.tsx`
- Site footer
- Links and information

### UI Components

**Button** - `frontend/components/Button.tsx`
- Reusable button component
- TailwindCSS styling
- Props: variant, size, loading state

**Navbar** - `frontend/components/Navbar.tsx`
- Navigation component

**TextInput** - `frontend/components/inputs/TextInput.tsx`
- Form text input
- Label support
- Error display

**ProductCard** - `frontend/components/ProductCard.tsx`
- Product display card
- Image, price, details

### Feature Components

**Auth Feature** - `frontend/features/auth/components/`

- **LoginForm.tsx** - Login form component
- **SignupForm.tsx** - Signup form component

Uses:
- React Hook Form for form state
- Redux dispatch for async actions
- Form validation
- Error handling

**Product Feature** - `frontend/features/product/components/`

- **ProductList.tsx** - List products with filtering/sorting

**Home Components** - `frontend/components/home/`

- **HomeCarousel.tsx** - Image carousel slider
- **BestSellerSection.tsx** - Featured products section

## Custom Hooks

### useToggle

**File**: `frontend/hooks/useToggle.ts`

Toggle boolean state hook:

```typescript
function useToggle(initial: boolean = false) {
  const [state, setState] = useState(initial);
  const toggle = () => setState(prev => !prev);
  return [state, toggle];
}
```

### useAuth (Feature)

**File**: `frontend/features/auth/hooks/useAuth.ts`

Auth-specific hook:
- Access current user from Redux
- Access auth loading states
- Dispatch auth actions

### useProducts (Feature)

**File**: `frontend/features/product/hooks/useProducts.ts`

Product data hook:
- Fetch products from API
- Manage loading/error states
- Return product list

## Styling

### TailwindCSS v4

Utility-first CSS framework:

**Global Styles** - `frontend/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Configuration** - `tailwind.config.ts`

**Usage Examples**:
- Colors: `bg-slate-50`, `text-slate-900`
- Spacing: `px-4`, `py-10`, `space-y-12`
- Responsive: `md:text-4xl`, `sm:px-10`
- Shadows: `shadow-sm`

### Typography

**Fonts** - Loaded in layout.tsx:
- **Nunito** - Main font (400, 500, 700 weights)
- **Geist Mono** - Monospace font

CSS variables:
```css
--font-nunito: Nunito
--font-geist-mono: Geist Mono
```

## Forms & Validation

### React Hook Form Integration

Library: `react-hook-form` v7.66.0

**Features**:
- Efficient form state management
- Built-in validation
- Minimal re-renders
- File input support
- Error handling

**Usage Pattern**:
```typescript
const { register, handleSubmit, formState: { errors } } = useForm();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email', { required: 'Email required' })} />
  {errors.email && <span>{errors.email.message}</span>}
</form>
```

## Notifications

### React Hot Toast

Toast notification library: `react-hot-toast` v2.6.0

**Configured in Providers**:
- Position: bottom-left
- Duration: 3000ms (3 seconds)
- Custom styling for success/error
- Success icon color: green (#10b981)
- Error icon color: red (#ef4444)

**Usage**:
```typescript
import toast from 'react-hot-toast';

toast.success('Email verified successfully!');
toast.error('Invalid OTP code');
```

## Environment Configuration

**File**: `frontend/.env.local` (local) or `.env.production` (build)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Next.js Config** - `frontend/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};
```

Allows image optimization from Unsplash CDN.

## Development

### Scripts

```bash
npm run dev        # Start dev server (http://localhost:3001)
npm run build      # Production build
npm run start      # Run production build
npm run lint       # Run ESLint
```

### Development Server

```bash
npm run dev --webpack
```

Runs on `http://localhost:3001` with hot reload.

## Error Handling

### API Error Handling

In thunks:
```typescript
try {
  return await apiCall();
} catch (err: any) {
  return rejectWithValue(
    err.response?.data?.message || 'Operation failed'
  );
}
```

### Toast Error Display

Components display errors via toast notifications:
```typescript
if (error) {
  toast.error(error);
}
```

## Next Steps

1. Review [API Contracts](./api-contracts.md) for endpoint details
2. See [Integration Architecture](./integration-architecture.md) for frontend-backend communication
3. Check [Component Inventory](./component-inventory.md) for component details
