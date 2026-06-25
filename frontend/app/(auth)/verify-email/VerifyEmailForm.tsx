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

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onTouched' });

  const onSubmit = async (data: FormData) => {
    if (!email) {
      setError('code', { message: 'Missing email. Please sign up again.' });
      return;
    }
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
