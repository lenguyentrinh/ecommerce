# Component Inventory

## Frontend Components Overview

Complete list of React components in the Next.js application.

---

## Layout Components

### Header Component
**File**: `frontend/components/layout/Header.tsx`
**Purpose**: Navigation bar and site header
**Props**: (to be determined from implementation)
**Responsibilities**:
- Display logo/branding
- Navigation menu
- User account menu (if authenticated)
- Mobile menu toggle

**Features**:
- Responsive design
- Active route highlighting
- Conditional auth links

### Footer Component
**File**: `frontend/components/layout/Footer.tsx`
**Purpose**: Site footer
**Props**: (to be determined from implementation)
**Responsibilities**:
- Display footer links
- Company information
- Copyright notice
- Social links (if applicable)

---

## Basic UI Components

### Button Component
**File**: `frontend/components/Button.tsx`

**Purpose**: Reusable button component

**Props**:
- `variant?: 'primary' | 'secondary' | 'danger'` - Button style variant
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `disabled?: boolean` - Disabled state
- `loading?: boolean` - Loading state with spinner
- `children: React.ReactNode` - Button text/content
- `onClick?: () => void` - Click handler
- `type?: 'button' | 'submit' | 'reset'` - HTML button type
- `className?: string` - Additional CSS classes

**Styling**: TailwindCSS utilities
- Primary: Blue background
- Secondary: Gray background
- Danger: Red background

**Example**:
```typescript
<Button variant="primary" size="md" onClick={handleClick}>
  Submit
</Button>
```

### Navbar Component
**File**: `frontend/components/Navbar.tsx`

**Purpose**: Navigation component

**Contains**: Likely integrated into Header

---

## Form Components

### TextInput Component
**File**: `frontend/components/inputs/TextInput.tsx`

**Purpose**: Reusable text input field

**Props**:
- `label?: string` - Input label
- `placeholder?: string` - Placeholder text
- `value?: string` - Current value
- `onChange?: (value: string) => void` - Change handler
- `error?: string` - Error message
- `disabled?: boolean` - Disabled state
- `type?: string` - Input type (text, email, password, etc.)
- `required?: boolean` - Required indicator
- `name?: string` - Input name attribute

**Styling**: TailwindCSS with label and error message support

**Features**:
- Label support
- Error message display
- Placeholder text
- Disabled state styling

---

## Authentication Forms

### LoginForm Component
**File**: `frontend/app/(auth)/login/LoginForm.tsx`

**Purpose**: User login form

**Form Fields**:
1. Email - Text input (type: email)
2. Password - Text input (type: password)
3. Submit button - "Login" action

**Behavior**:
- Uses React Hook Form for state management
- Validates email and password
- Dispatches `loginThunk` on submit
- Shows loading state while authenticating
- Displays error messages
- Redirects to dashboard on success
- Redirects to signup if user doesn't exist

**State Management**: Redux auth state
- Reads: `loginLoading` from auth slice
- Dispatches: `loginThunk` async action

### SignupForm Component
**File**: `frontend/app/(auth)/signup/SignupForm.tsx`

**Purpose**: User registration form

**Form Fields**:
1. Username - Text input
2. Email - Text input (type: email)
3. Password - Text input (type: password)
4. Birth Date - Date input
5. Phone Number - Text input (type: tel)
6. Submit button - "Sign Up" action

**Behavior**:
- Uses React Hook Form for form state
- Validates all fields
- Dispatches `signupThunk` on submit
- Shows loading state
- Displays field errors
- Redirects to email verification on success
- Prevents duplicate email registration

**State Management**: Redux auth state
- Reads: `signupLoading` from auth slice
- Dispatches: `signupThunk` async action

### VerifyEmailForm Component
**File**: `frontend/app/(auth)/verify-email/VerifyEmailForm.tsx`

**Purpose**: Email verification via OTP

**Form Fields**:
1. Email - Text input (auto-filled if from signup)
2. OTP Code - Text input (6 digits)
3. Submit button - "Verify Email"

**Behavior**:
- Displays email from signup flow
- Accepts OTP code from email
- Dispatches `verifyEmailThunk` on submit
- Shows loading state
- Displays error if OTP invalid or expired
- Redirects to login on success
- Option to resend OTP (uses `sendOtpThunk`)

**State Management**: Redux auth state
- Reads: `verifyEmailLoading` from auth slice
- Dispatches: `verifyEmailThunk` async action

### ForgotPasswordByEmailForm Component
**File**: `frontend/app/(auth)/forgotPassword/ForgotPasswordByEmailForm.tsx`

**Purpose**: Password reset initiation

**Form Fields**:
1. Email - Text input (type: email)
2. Submit button - "Send Reset Link"

**Behavior**:
- User enters email
- Submits to start password reset flow
- Backend sends OTP to email
- Navigates to OTP verification form
- No state update needed (backend handles)

### OTP Form Component (Password Reset)
**File**: `frontend/app/(auth)/forgotPassword/otp/otpForm.tsx`

**Purpose**: OTP verification for password reset

**Form Fields**:
1. Email - Display only
2. OTP Code - Text input (6 digits)
3. Submit button - "Verify OTP"

**Behavior**:
- Receives email from previous form
- User enters OTP from email
- Dispatches `verifyOtpThunk` on submit
- Shows loading state
- Displays error if invalid/expired
- Redirects to password reset form on success
- Option to resend OTP

**State Management**: Redux auth state
- Reads: `verifyOtpLoading` from auth slice
- Dispatches: `verifyOtpThunk` async action

### ResetPasswordForm Component
**File**: `frontend/app/(auth)/forgotPassword/reset/ResetPasswordForm.tsx`

**Purpose**: Password reset with new password

**Form Fields**:
1. Email - Display only
2. New Password - Text input (type: password)
3. Confirm Password - Text input (type: password)
4. Submit button - "Reset Password"

**Behavior**:
- User enters new password twice
- Validates passwords match
- Dispatches `resetPasswordThunk` on submit
- Shows loading state
- Displays validation errors
- Redirects to login on success
- Password must differ from current

**State Management**: Redux auth state
- Reads: `resetPasswordLoading` from auth slice
- Dispatches: `resetPasswordThunk` async action

---

## Feature Components

### LoginForm (Feature)
**File**: `frontend/features/auth/components/LoginForm.tsx`

Duplicate of app-level LoginForm - may be for feature module organization.

### SignupForm (Feature)
**File**: `frontend/features/auth/components/SignupForm.tsx`

Duplicate of app-level SignupForm - may be for feature module organization.

### ProductList Component
**File**: `frontend/features/product/components/ProductList.tsx`

**Purpose**: Display list of products

**Props**:
- `products: Product[]` - Array of products to display
- `loading?: boolean` - Loading state
- `onSelectProduct?: (id: number) => void` - Selection handler

**Features**:
- Renders ProductCard for each product
- Handles loading state
- Empty state messaging

---

## Product Components

### ProductCard Component
**File**: `frontend/components/ProductCard.tsx`

**Purpose**: Individual product display card

**Props**:
- `id: number` - Product ID
- `name: string` - Product name
- `price: number` - Product price
- `image?: string` - Product image URL
- `rating?: number` - Product rating (0-5)
- `reviews?: number` - Number of reviews
- `onSelect?: () => void` - Selection handler

**Features**:
- Product image with fallback
- Product name and price
- Rating stars (if applicable)
- Add to cart button
- Quick view button

**Styling**: TailwindCSS card design

---

## Home Page Components

### HomeCarousel Component
**File**: `frontend/components/home/HomeCarousel.tsx`

**Purpose**: Image carousel slider on home page

**Features**:
- Image carousel/slider
- Auto-play with manual controls
- Navigation dots
- Responsive design

**Images**: From Unsplash (configured in next.config.ts)

### BestSellerSection Component
**File**: `frontend/components/home/BestSellerSection.tsx`

**Purpose**: Featured/bestseller products section

**Contains**:
- Section title
- Grid of best-selling products
- ProductCard components
- "View All" button

**Data Flow**:
- Likely fetches from `useProducts` hook
- Displays top N products
- Links to full product list

---

## Feature Hooks

### useAuth Hook
**File**: `frontend/features/auth/hooks/useAuth.ts`

**Purpose**: Authentication utility hook

**Returns**:
```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  loginLoading: boolean,
  signupLoading: boolean,
  verifyEmailLoading: boolean,
  meLoading: boolean,
  logout: () => void,
  dispatch: AppDispatch
}
```

**Usage**:
```typescript
const { user, isAuthenticated, logout } = useAuth();

if (!isAuthenticated) {
  return <Navigate to="/login" />;
}
```

### useProducts Hook
**File**: `frontend/features/product/hooks/useProducts.ts`

**Purpose**: Product data management

**Returns**:
```typescript
{
  products: Product[],
  loading: boolean,
  error: string | null,
  refetch: () => void
}
```

**Features**:
- Fetches product list from API
- Handles loading/error states
- Provides refresh capability

### useToggle Hook
**File**: `frontend/hooks/useToggle.ts`

**Purpose**: Boolean state toggling

**Signature**:
```typescript
function useToggle(initial: boolean = false): [boolean, () => void]
```

**Usage**:
```typescript
const [isOpen, toggle] = useToggle(false);

<button onClick={toggle}>
  {isOpen ? 'Hide' : 'Show'}
</button>
```

---

## Custom Hooks Summary

| Hook | Location | Purpose |
|------|----------|---------|
| `useAuth` | `features/auth/hooks/` | Authentication state & actions |
| `useProducts` | `features/product/hooks/` | Product data fetching |
| `useToggle` | `hooks/` | Boolean state toggle |

---

## Component Styling

### TailwindCSS Classes Used

**Layout**:
- `container`, `mx-auto`, `px-4`, `py-8`
- `min-h-screen`, `w-full`, `h-auto`
- `flex`, `grid`, `space-y-4`, `gap-4`

**Colors**:
- `bg-slate-50` - Light background
- `bg-white` - White background
- `text-slate-900` - Dark text
- `text-orange-600` - Accent color
- `border-slate-200` - Light border

**Typography**:
- `text-3xl`, `text-4xl` - Large headings
- `font-extrabold`, `font-semibold` - Font weights
- `uppercase`, `tracking-wide` - Text decoration

**Responsive**:
- `md:text-4xl` - Breakpoint adjustments
- `sm:px-10` - Responsive padding
- `sm:py-12` - Responsive spacing

**Effects**:
- `shadow-sm`, `shadow-lg` - Shadows
- `rounded-3xl` - Border radius
- `hover:bg-blue-600` - Hover effects

---

## Component Lifecycle

### Page Load Flow

1. **Layout Renders** (`app/layout.tsx`)
   - Loads fonts
   - Sets up Providers
   - Renders Header, Footer

2. **Providers Initialize** (`app/providers.tsx`)
   - Redux store created
   - AuthBootstrap effect fires
   - `fetchMeThunk` dispatched
   - Toaster configured

3. **Page Renders** (e.g., `app/page.tsx`)
   - Home page loads
   - Components render
   - Data fetching begins

4. **Components Render** (e.g., `BestSellerSection`)
   - Fetch products
   - Render ProductCards
   - Setup event handlers

---

## State Management Integration

### Redux Connected Components

Components that read/write Redux state:

1. **LoginForm** - Reads `loginLoading`, dispatches `loginThunk`
2. **SignupForm** - Reads `signupLoading`, dispatches `signupThunk`
3. **VerifyEmailForm** - Reads `verifyEmailLoading`, dispatches `verifyEmailThunk`
4. **ResetPasswordForm** - Reads `resetPasswordLoading`, dispatches `resetPasswordThunk`
5. **Header** - Reads `isAuthenticated`, `user` for conditional rendering
6. **useAuth Hook** - Provides access to auth state

### Local State Components

Components with local state only:

1. **Button** - No state (controlled by parent)
2. **TextInput** - Optional local state via React Hook Form
3. **ProductCard** - No state (controlled by parent)
4. **HomeCarousel** - Local carousel state

---

## Accessibility Considerations

Current accessibility features:
- Semantic HTML (form labels, buttons)
- Input types (email, password, tel)
- Error messages associated with fields
- Button click handlers

**Recommended improvements**:
- Add ARIA labels for screen readers
- Add keyboard navigation support
- Add focus indicators
- Test with accessibility tools

---

## Performance Optimization Opportunities

1. **Code Splitting**: Lazy load auth routes
2. **Image Optimization**: Use next/image for ProductCard
3. **Memoization**: Wrap components with React.memo()
4. **Bundle Size**: Analyze bundle with webpack-bundle-analyzer

---

## Component Tree Structure

```
<RootLayout>
  <Providers>
    <Header />
    <main>
      {children}
      <!-- Page-specific content -->
      <!-- Example: HomePage contains HomeCarousel + BestSellerSection -->
    </main>
    <Footer />
    <Toaster />
  </Providers>
</RootLayout>
```

---

## Related Documentation

- [Architecture - Frontend](./architecture-frontend.md)
- [Development Guide](./development-guide.md)
- [API Contracts](./api-contracts.md)
