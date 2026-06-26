'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowRight } from 'react-icons/fi';
import InputField from '@/components/InputField';
import { AppDispatch, RootState } from '@/store/store';
import { verifyEmailThunk, sendOtpThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';
import { verifyEmailSchema, type VerifyEmailValues } from '@/lib/validation/authSchemas';

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
  } = useForm<VerifyEmailValues>({ mode: 'onTouched', resolver: zodResolver(verifyEmailSchema) });

  const onSubmit = async (data: VerifyEmailValues) => {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
      {email && (
        <p className="text-center text-body-md text-warm-gray">
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-brown">{email}</span>
        </p>
      )}

      <InputField
        id="code"
        variant="glass"
        required
        label="Verification Code"
        type="text"
        placeholder="123456"
        inputMode="numeric"
        maxLength={6}
        error={errors.code?.message}
        {...register('code')}
      />

      <button
        type="submit"
        disabled={verifyEmailLoading}
        className="btn-vivid group flex w-full items-center justify-center gap-sm rounded-full py-4 text-headline-md text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifyEmailLoading ? 'Verifying...' : 'Verify Email'}
        {!verifyEmailLoading && (
          <FiArrowRight
            size={22}
            className="transition-transform duration-500 group-hover:translate-x-2"
          />
        )}
      </button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-body-md text-warm-gray underline transition-colors duration-300 hover:text-brown disabled:opacity-50"
        >
          {resending ? 'Resending...' : 'Resend code'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="rounded-full border border-clay/50 px-5 py-2 text-body-md text-brown transition-colors hover:border-clay"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
