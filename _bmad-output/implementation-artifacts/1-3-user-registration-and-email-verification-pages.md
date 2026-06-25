# Story 1.3: User Registration & Email Verification Pages

---
baseline_commit: 639d2f4
---

Status: done
Review Status: done

## Story

As a shopper,
I want to register an account and verify my email with a one-time code,
So that I can access my orders and saved addresses on future visits.

## Acceptance Criteria

**AC1 — Signup page renders with Oren design**
Given the shopper navigates to `/signup`,
When the registration page renders,
Then the form has fields: Full Name (required), Email (required), Password with strength indicator (required), Phone (optional); all inputs use `<InputField>` with Oren styling; a primary pill "Create Account" button is present; the page background is Soft Ivory; Nunito Sans typography is applied.

**AC2 — Successful registration redirects with toast**
Given the shopper submits valid registration data,
When `POST /api/auth/signup` succeeds,
Then the shopper is redirected to `/verify-email?email=<encoded>` with their email shown; a toast "Check your email for a 6-digit code" appears.

**AC3 — Inline validation before API call**
Given the shopper submits invalid data,
When they attempt to submit,
Then inline validation errors appear below each failing field before the API is called; errors use Oren error color (`text-error`).

**AC4 — Verify email page with OTP flow**
Given the shopper is on `/verify-email` and enters their 6-digit OTP,
When `POST /api/auth/verify-email` is called,
Then on success: redirect to `/login` with toast "Email verified! You can now log in."; on invalid/expired OTP: inline error "Invalid or expired code. Please try again."; a "Resend code" link re-triggers OTP generation.

**AC5 — Duplicate email shows inline error**
Given registration is attempted with an existing email,
When the API returns 409 Conflict,
Then the form shows inline error "An account with this email already exists." without redirecting.

## Tasks / Subtasks

- [x] **Task 1: Restyle Signup page to Oren design system** (AC1, AC2, AC3, AC5)
  - [x] Update `frontend/app/(auth)/signup/page.tsx` — Soft Ivory bg, centered Warm White card with ambient shadow, Headline MD title "Create Account"
  - [x] Update `frontend/app/(auth)/signup/SignupForm.tsx` — replace all `TextInput` with `InputField`; use `Button` component for submit
  - [x] Form fields (in order): Full Name (`userName`, required), Email (required), Password (required), Phone (`phoneNumber`, optional)
  - [x] Remove `birthDate` field (not in AC; not required by story)
  - [x] Keep `confirmPassword` field for UX safety
  - [x] Change success toast to: `showToast.success('Check your email for a 6-digit code')`
  - [x] On 409 (error string === `'Email already exists'`): call `setError('email', { message: 'An account with this email already exists.' })` — do NOT show toast
  - [x] On all other errors: `showToast.error(err as string)`
  - [x] Redirect uses `data.email` from form values

- [x] **Task 2: Add Password Strength Indicator** (AC1)
  - [x] Create `frontend/app/(auth)/signup/PasswordStrengthIndicator.tsx`
  - [x] Accepts `password: string` prop; renders 3 horizontal bars (`h-1 rounded-full`)
  - [x] Strength logic: Weak = length < 8; Medium = length >= 8 + (uppercase OR number, not both+special); Strong = length >= 8 + uppercase + number + special char
  - [x] Bar colors: Weak → 1 bar `bg-error`, 2 bars `bg-warm-beige`; Medium → 2 bars `bg-alert`, 1 bar `bg-warm-beige`; Strong → 3 bars `bg-success`; Empty → 3 bars `bg-warm-beige`
  - [x] Place below Password field, above Confirm Password field
  - [x] In `SignupForm.tsx`: use `useWatch({ control, name: 'password' })` to get live value

- [x] **Task 3: Restyle Verify Email page to Oren design system** (AC4)
  - [x] Update `frontend/app/(auth)/verify-email/page.tsx` — Soft Ivory bg, Warm White card, Headline MD title "Verify your email"
  - [x] Update `frontend/app/(auth)/verify-email/VerifyEmailForm.tsx` — replace `TextInput` with `InputField` for OTP code field
  - [x] Replace raw `<button>` elements with `Button` component
  - [x] Change success toast to: `showToast.success('Email verified! You can now log in.')`
  - [x] On OTP failure: `setError('code', { message: 'Invalid or expired code. Please try again.' })` — NOT toast
  - [x] Add "Resend code" link: calls `sendOtpThunk({ email })` from Redux; disables during loading; `showToast.success('Code resent. Check your inbox.')` on success
  - [x] Display user email from URL search param so shopper knows where to look

- [x] **Task 4: Write tests** (all ACs)
  - [x] `frontend/app/(auth)/signup/SignupForm.test.tsx` — renders all AC1 fields; 409 shows inline email error not toast; success redirects with correct URL
  - [x] `frontend/app/(auth)/verify-email/VerifyEmailForm.test.tsx` — "Resend code" link present; OTP failure shows inline error; success redirects to `/login`

### Review Findings

- [x] [Review][Decision] Toast before router.push — accepted; toast provider is global and persists across navigation. No change needed.
- [x] [Review][Patch] Remove birthDate entirely from SignupPayload — spec says "Remove birthDate field"; making it `?: string` is insufficient. Delete the field from the `SignupPayload` interface. [frontend/services/authAPI.ts:7]
- [x] [Review][Patch] phoneNumber optional in form but `string` (required) in SignupPayload type — form labels it "Phone (optional)" with no required validator, but `authAPI.ts` still has `phoneNumber: string`; sending empty string may fail backend validation. Fix: `phoneNumber?: string` in `SignupPayload`. [frontend/services/authAPI.ts:7]
- [x] [Review][Patch] No null-guard for email in VerifyEmailForm.onSubmit — `handleResend` guards with `if (!email) return` but `onSubmit` dispatches `verifyEmailThunk({ code, email: null })` without guard; user landing on /verify-email without ?email= param sends null to backend. [frontend/app/(auth)/verify-email/VerifyEmailForm.tsx:32]
- [x] [Review][Patch] Duplicate password watcher — both `watch('password')` → passwordValue and `useWatch({ control, name: 'password' })` → passwordWatch are active; remove the redundant `watch` call, use `passwordWatch` for the confirmPassword validate callback too. [frontend/app/(auth)/signup/SignupForm.tsx:32-33]
- [x] [Review][Patch] `<a href>` instead of Next.js `<Link>` — raw anchor tags in both page.tsx files trigger full page reload and lose in-memory Redux state; replace with `import Link from 'next/link'`. [frontend/app/(auth)/signup/page.tsx:14, frontend/app/(auth)/verify-email/page.tsx:21]
- [x] [Review][Defer] Brittle string match 'Email already exists' — error discrimination depends on exact API string; intentional per spec but fragile if the backend error message changes. [frontend/app/(auth)/signup/SignupForm.tsx:48] — deferred, intentional per spec
- [x] [Review][Defer] Cancel button in VerifyEmailForm not in spec — scope addition; beneficial UX but no AC backs it. [frontend/app/(auth)/verify-email/VerifyEmailForm.tsx:82] — deferred, benign addition
- [x] [Review][Defer] PasswordStrengthIndicator has no dedicated unit tests — renders correctly but strength logic and ARIA labels are not tested in isolation; spec did not require them. — deferred, not spec-required
- [x] [Review][Defer] key={i} array index in PasswordStrengthIndicator — static 3-element array, low risk but violates React best practice. [frontend/app/(auth)/signup/PasswordStrengthIndicator.tsx:37] — deferred, pre-existing anti-pattern
- [x] [Review][Defer] No test for signupLoading=true submit button state — loading branch is untested. — deferred, not spec-required

## Dev Notes

### This is a Frontend-Only Story — No Backend Changes

All backend endpoints already exist and are confirmed working:

| Endpoint | Used for |
|---|---|
| `POST /api/auth/signup` | Registration — returns `{ message, email }` |
| `POST /api/auth/verify-email` | OTP verification — body `{ email, code }` |
| `POST /api/auth/send-otp` | Resend OTP — body `{ email }` |

Backend 409 conflict message is exactly: **`'Email already exists'`** (from `ConflictException`).

### CRITICAL: Use `InputField`, NOT `TextInput`

Two input components exist. This story uses ONLY `InputField`:

| Component | Path | Use? |
|---|---|---|
| `InputField` | `components/InputField.tsx` | YES — Oren-styled forwardRef |
| `TextInput` | `components/inputs/TextInput.tsx` | NO — old, non-Oren |

`InputField` is a `forwardRef` component. Works with react-hook-form via register spread — no `Controller` needed:

```tsx
import InputField from '@/components/InputField';

<InputField
  {...register('email', { required: 'Email is required' })}
  label="Email"
  type="email"
  placeholder="your@email.com"
  error={errors.email?.message}
/>
```

### CRITICAL: Use `Button` Component, NOT Raw `<button>`

```tsx
import Button from '@/components/Button';

// Primary CTA:
<Button type="submit" disabled={signupLoading} className="w-full mt-xs">
  {signupLoading ? 'Creating account...' : 'Create Account'}
</Button>

// Secondary:
<Button variant="secondary" type="button" onClick={() => router.push('/login')}>
  Cancel
</Button>
```

### Oren Page Layout for Auth Pages

Both `page.tsx` files must follow this card layout pattern:

```tsx
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-sm">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-ambient p-md">
        <h1 className="text-headline-md text-brown text-center mb-md tracking-[0.03em]">
          Create Account
        </h1>
        <SignupForm />
        <p className="text-center text-body-md text-warm-gray mt-sm">
          Already have an account?{' '}
          <a href="/login" className="text-brown underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
```

`max-w-md` (448px) for auth cards. The existing signup page used `max-w-2xl` — too wide, replace it.

### SignupForm — Full Implementation Pattern

```tsx
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { AppDispatch, RootState } from '@/store/store';
import { signupThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';

type FormData = {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
};

export default function SignupForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { signupLoading } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onTouched' });

  const passwordValue = watch('password');
  const passwordWatch = useWatch({ control, name: 'password' });

  const onSubmit = async (data: FormData) => {
    const { confirmPassword, ...payload } = data;
    try {
      await dispatch(signupThunk(payload)).unwrap();
      showToast.success('Check your email for a 6-digit code');
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      if (err === 'Email already exists') {
        setError('email', { message: 'An account with this email already exists.' });
      } else {
        showToast.error(err as string);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-sm">
      <InputField
        {...register('userName', { required: 'Full name is required' })}
        label="Full Name"
        type="text"
        placeholder="Jane Doe"
        error={errors.userName?.message}
      />
      <InputField
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
        })}
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
      />
      <InputField
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Password must be at least 8 characters' },
        })}
        label="Password"
        type="password"
        placeholder="Min. 8 characters"
        error={errors.password?.message}
      />
      <PasswordStrengthIndicator password={passwordWatch ?? ''} />
      <InputField
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (v) => v === passwordValue || 'Passwords do not match',
        })}
        label="Confirm Password"
        type="password"
        placeholder="Repeat password"
        error={errors.confirmPassword?.message}
      />
      <InputField
        {...register('phoneNumber')}
        label="Phone (optional)"
        type="tel"
        placeholder="+1 234 567 8900"
        error={errors.phoneNumber?.message}
      />
      <Button type="submit" disabled={signupLoading} className="w-full mt-xs">
        {signupLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
```

### PasswordStrengthIndicator — Full Implementation Pattern

```tsx
// frontend/app/(auth)/signup/PasswordStrengthIndicator.tsx

type Strength = 'empty' | 'weak' | 'medium' | 'strong';

function getStrength(password: string): Strength {
  if (!password) return 'empty';
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isLong = password.length >= 8;
  if (!isLong) return 'weak';
  if (hasUpper && hasNumber && hasSpecial) return 'strong';
  if (hasUpper || hasNumber) return 'medium';
  return 'weak';
}

const BAR_COLORS: Record<Strength, string[]> = {
  empty:  ['bg-warm-beige', 'bg-warm-beige', 'bg-warm-beige'],
  weak:   ['bg-error',      'bg-warm-beige', 'bg-warm-beige'],
  medium: ['bg-alert',      'bg-alert',      'bg-warm-beige'],
  strong: ['bg-success',    'bg-success',    'bg-success'],
};

const LABELS: Record<Strength, string> = {
  empty: '', weak: 'Weak', medium: 'Medium', strong: 'Strong',
};

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getStrength(password);
  const colors = BAR_COLORS[strength];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {colors.map((color, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${color}`} />
        ))}
      </div>
      {strength !== 'empty' && (
        <span className="text-label-sm text-warm-gray">{LABELS[strength]}</span>
      )}
    </div>
  );
}
```

### VerifyEmailForm — Full Implementation Pattern

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import { AppDispatch, RootState } from '@/store/store';
import { verifyEmailThunk, sendOtpThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';

interface FormData {
  code: string;
}

export default function VerifyEmailForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const email = useSearchParams().get('email');
  const { verifyEmailLoading } = useSelector((state: RootState) => state.auth);
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>({
    mode: 'onTouched',
  });

  const onSubmit = async (data: FormData) => {
    try {
      await dispatch(verifyEmailThunk({ code: data.code, email })).unwrap();
      showToast.success('Email verified! You can now log in.');
      router.push('/login');
    } catch {
      setError('code', { message: 'Invalid or expired code. Please try again.' });
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await dispatch(sendOtpThunk({ email })).unwrap();
      showToast.success('Code resent. Check your inbox.');
    } catch {
      showToast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-sm">
      {email && (
        <p className="text-body-md text-warm-gray text-center">
          We sent a 6-digit code to{' '}
          <span className="text-brown font-semibold">{email}</span>
        </p>
      )}
      <InputField
        {...register('code', {
          required: 'Please enter the verification code',
          pattern: { value: /^\d{6}$/, message: 'Code must be 6 digits' },
        })}
        label="Verification Code"
        type="text"
        placeholder="123456"
        inputMode="numeric"
        maxLength={6}
        error={errors.code?.message}
      />
      <Button type="submit" disabled={verifyEmailLoading} className="w-full">
        {verifyEmailLoading ? 'Verifying...' : 'Verify Email'}
      </Button>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-body-md text-warm-gray hover:text-brown underline transition-colors duration-300 disabled:opacity-50"
        >
          {resending ? 'Resending...' : 'Resend code'}
        </button>
        <Button variant="secondary" type="button" onClick={() => router.push('/login')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

### Oren Token Class Reference

| Token | Tailwind Class | Value |
|---|---|---|
| Soft Ivory background | `bg-ivory` | `#faf7f2` |
| Warm White surface | `bg-surface` | `#fff8f4` |
| Warm Beige fill | `bg-warm-beige` | `#e8dccb` |
| Primary text | `text-brown` | `#4a3f35` |
| Secondary text | `text-warm-gray` | `#787770` |
| Inline error text | `text-error` | `#b8998a` |
| Error bar | `bg-error` | `#b8998a` |
| Alert bar | `bg-alert` | `#c4a896` |
| Success bar | `bg-success` | `#a89a7f` |
| Focus border | `border-clay` | `#c9b2a6` |
| Ambient shadow | `shadow-ambient` | `0 8px 40px rgba(74,63,53,0.04)` |
| Headline MD | `text-headline-md` | 24px / 600 / 1.3 |
| Body MD | `text-body-md` | 16px / 400 / 1.5 |
| Label SM | `text-label-sm` | 12px / 600 / uppercase |
| Padding MD | `p-md` | 24px |
| Padding SM | `p-sm` | 16px |
| Gap SM | `gap-sm` | 16px |
| Gap XS | `gap-xs` | 8px |
| Margin top XS | `mt-xs` | 8px |
| Margin top SM | `mt-sm` | 16px |
| Margin top MD | `mt-md` | 24px |

### File Locations Reference

| Action | File Path |
|---|---|
| UPDATE | `frontend/app/(auth)/signup/page.tsx` |
| UPDATE | `frontend/app/(auth)/signup/SignupForm.tsx` |
| NEW | `frontend/app/(auth)/signup/PasswordStrengthIndicator.tsx` |
| UPDATE | `frontend/app/(auth)/verify-email/page.tsx` |
| UPDATE | `frontend/app/(auth)/verify-email/VerifyEmailForm.tsx` |
| NEW | `frontend/app/(auth)/signup/SignupForm.test.tsx` |
| NEW | `frontend/app/(auth)/verify-email/VerifyEmailForm.test.tsx` |

### Do NOT Touch

- `frontend/store/authSlice.ts` — already handles `signupThunk`, `verifyEmailThunk`
- `frontend/store/authThunk.ts` — `signupThunk`, `verifyEmailThunk`, `sendOtpThunk` all already exist
- `frontend/services/authAPI.ts` — all API calls already wired
- `frontend/services/api.ts` — axios client already configured
- `frontend/components/InputField.tsx` — use as-is, do not modify
- `frontend/components/Button.tsx` — use as-is, do not modify
- `frontend/app/(auth)/login/` — NOT in scope for this story

### sendOtpThunk Already Exists

```typescript
// Already in frontend/store/authThunk.ts:
export const sendOtpThunk = createAsyncThunk(
  'auth/send-otp',
  async (data: sendOtpPayload, { rejectWithValue }) => { ... }
);
// sendOtpPayload = { email: string }
```

No new Redux code needed for resend.

### 409 Error Handling — Exact String Match

The error reaches the thunk catch block as the `rejectWithValue` string from `err.response?.data?.message`.

```tsx
// In onSubmit catch:
if (err === 'Email already exists') {
  setError('email', { message: 'An account with this email already exists.' });
} else {
  showToast.error(err as string);
}
```

### Testing Pattern

```tsx
// SignupForm.test.tsx skeleton:
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import SignupForm from './SignupForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/store/authThunk', () => ({
  signupThunk: jest.fn(() => ({ type: 'auth/signup', unwrap: jest.fn() })),
  sendOtpThunk: jest.fn(() => ({ type: 'auth/send-otp', unwrap: jest.fn() })),
}));

// VerifyEmailForm.test.tsx skeleton:
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => 'test@example.com' }),
}));
```

Wrap components in `<Provider store={store}>`. Use `@testing-library/user-event` for interactions.

### Learnings from Stories 1.1 & 1.2

- **pnpm only** — use `pnpm add`, never `npm install`
- **Single quotes + trailing commas** — Prettier applies to all `.ts`/`.tsx` files
- **`"use client"` required** — forms are Client Components; `page.tsx` wrappers can remain Server Components (no hooks, no state)
- **Jest 30** — flag is `--testPathPatterns` (plural)
- **No CSS imports in tests** — `jest.config.ts` has no CSS transform; don't import `globals.css` in tests
- **Architecture D15** — auth forms are Client Components; no SEO requirement so no `generateMetadata()` needed

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed `jest.spyOn(reactRedux, 'useDispatch')` → `Cannot redefine property` error on ESM modules. Solution: use `jest.mock('react-redux', ...)` at module level with factory that spreads `requireActual`.
- Fixed resend test mock bleed-through: `clearAllMocks()` does not reset implementations; switched to `resetAllMocks()` in VerifyEmailForm tests.
- `birthDate` was a required field in `SignupPayload` but backend marks it `@IsOptional()`. Made it optional in `frontend/services/authAPI.ts` to allow removing it from the signup form without TypeScript errors.

### Completion Notes List

- **Task 1 (Signup page):** Rewrote `signup/page.tsx` to Oren Soft Ivory + Warm White card layout. Rewrote `SignupForm.tsx` replacing all `TextInput` with `InputField` (forwardRef, Oren-styled), replaced raw `<button>` with `Button` component, removed `birthDate` field, changed success toast to "Check your email for a 6-digit code", added 409 inline email error via `setError`, redirect uses `data.email`.
- **Task 2 (PasswordStrengthIndicator):** Created `PasswordStrengthIndicator.tsx` with `getStrength()` logic, 3 bar display, and Oren token classes (`bg-error`/`bg-alert`/`bg-success`/`bg-warm-beige`). Integrated into `SignupForm` via `useWatch`.
- **Task 3 (Verify email page):** Rewrote `verify-email/page.tsx` to Oren layout with `Suspense`. Rewrote `VerifyEmailForm.tsx` replacing `TextInput` with `InputField`, raw buttons with `Button`, success toast to "Email verified! You can now log in.", OTP failure to inline `setError`, added "Resend code" button calling `sendOtpThunk`, displays email from URL param.
- **Task 4 (Tests):** 10 tests across 2 files. All 27 total frontend tests pass, zero regressions.

### File List

- `frontend/app/(auth)/signup/page.tsx` (updated)
- `frontend/app/(auth)/signup/SignupForm.tsx` (updated)
- `frontend/app/(auth)/signup/PasswordStrengthIndicator.tsx` (new)
- `frontend/app/(auth)/signup/SignupForm.test.tsx` (new)
- `frontend/app/(auth)/verify-email/page.tsx` (updated)
- `frontend/app/(auth)/verify-email/VerifyEmailForm.tsx` (updated)
- `frontend/app/(auth)/verify-email/VerifyEmailForm.test.tsx` (new)
- `frontend/services/authAPI.ts` (updated — `birthDate` made optional)

### Change Log

- 2026-06-24: Implemented Story 1.3 — Oren-styled signup and verify-email pages, PasswordStrengthIndicator, inline 409/OTP error handling, resend OTP flow, 10 component tests (27 total pass).
