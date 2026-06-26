'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import InputField from '@/components/InputField';
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

const eyeToggleClass =
  'absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/50 transition-colors hover:text-brown';

export default function SignupForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { signupLoading } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onTouched' });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
      {/* Full Name */}
      <InputField
        id="userName"
        variant="glass"
        label="Full Name"
        type="text"
        placeholder="Jane Doe"
        error={errors.userName?.message}
        {...register('userName', { required: 'Full name is required' })}
      />

      {/* Email Address */}
      <InputField
        id="email"
        variant="glass"
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
        })}
      />

      {/* Password + Confirm (two columns) */}
      <div className="grid grid-cols-1 gap-md md:grid-cols-2">
        <InputField
          id="password"
          variant="glass"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className={eyeToggleClass}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          }
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />

        <InputField
          id="confirmPassword"
          variant="glass"
          label="Confirm"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Repeat password"
          error={errors.confirmPassword?.message}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              className={eyeToggleClass}
            >
              {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          }
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (v) => v === passwordWatch || 'Passwords do not match',
          })}
        />
      </div>

      {/* Password strength (full width, below the password row) */}
      <div className="px-2">
        <PasswordStrengthIndicator password={passwordWatch ?? ''} />
      </div>

      {/* Phone (Optional) */}
      <InputField
        id="phoneNumber"
        variant="glass"
        label={
          <>
            Phone Number{' '}
            <span className="font-normal normal-case italic opacity-40">(Optional)</span>
          </>
        }
        type="tel"
        placeholder="+1 (555) 000-0000"
        error={errors.phoneNumber?.message}
        {...register('phoneNumber')}
      />

      {/* CTA */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={signupLoading}
          className="btn-vivid group flex w-full items-center justify-center gap-sm rounded-full py-4 text-headline-md text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signupLoading ? 'Preparing your experience...' : 'Begin Your Journey'}
          {!signupLoading && (
            <FiArrowRight
              size={22}
              className="transition-transform duration-500 group-hover:translate-x-2"
            />
          )}
        </button>
        <p className="pt-2 text-center text-[11px] text-warm-gray/50">
          By joining, you agree to our{' '}
          <a href="#" className="underline transition-colors hover:text-brown">
            Ethics
          </a>{' '}
          &amp;{' '}
          <a href="#" className="underline transition-colors hover:text-brown">
            Privacy
          </a>
          .
        </p>
      </div>
    </form>
  );
}
