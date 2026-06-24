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
