'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';
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

const labelClass =
  'text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-gray/70';
const inputClass =
  'w-full h-[60px] rounded-[12px] bg-warm-beige/40 px-5 text-body-md text-brown placeholder:text-warm-gray/40 outline-none border border-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-clay focus:shadow-[0_0_15px_rgba(231,198,193,0.7)]';
const errorClass = 'text-[12px] text-error mt-1';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg" noValidate>
      {/* Full Name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="userName" className={labelClass}>
          Full Name
        </label>
        <input
          id="userName"
          type="text"
          placeholder="Jane Doe"
          className={inputClass}
          {...register('userName', { required: 'Full name is required' })}
        />
        {errors.userName && (
          <span role="alert" className={errorClass}>
            {errors.userName.message}
          </span>
        )}
      </div>

      {/* Email Address */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className={inputClass}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
          })}
        />
        {errors.email && (
          <span role="alert" className={errorClass}>
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Phone (Optional) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="phoneNumber" className={labelClass}>
          Phone (Optional)
        </label>
        <input
          id="phoneNumber"
          type="tel"
          placeholder="+1 234 567 8900"
          className={inputClass}
          {...register('phoneNumber')}
        />
        {errors.phoneNumber && (
          <span role="alert" className={errorClass}>
            {errors.phoneNumber.message}
          </span>
        )}
      </div>

      {/* Your secret key (Password) */}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Your secret key
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            className={`${inputClass} pr-12`}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-md top-1/2 -translate-y-1/2 text-warm-gray/50 transition-colors hover:text-brown"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
        {/* Password Strength Indicator */}
        <PasswordStrengthIndicator password={passwordWatch ?? ''} />
        {errors.password && (
          <span role="alert" className={errorClass}>
            {errors.password.message}
          </span>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat password"
            className={`${inputClass} pr-12`}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === passwordWatch || 'Passwords do not match',
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            className="absolute right-md top-1/2 -translate-y-1/2 text-warm-gray/50 transition-colors hover:text-brown"
          >
            {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <span role="alert" className={errorClass}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      {/* Submit */}
      <div className="pt-md">
        <Button
          type="submit"
          disabled={signupLoading}
          className="w-full py-4 tracking-[0.2em]"
        >
          {signupLoading ? 'Preparing your experience...' : 'Begin your journey'}
        </Button>
        <p className="mt-md text-center text-[13px] italic text-warm-gray/70">
          Curated pieces. Soft elegance. Delivered with care.
        </p>
      </div>
    </form>
  );
}
