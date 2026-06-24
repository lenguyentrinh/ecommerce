import { Suspense } from 'react';
import VerifyEmailForm from './VerifyEmailForm';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-sm">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-ambient p-md">
        <h1 className="text-headline-md text-brown text-center mb-md tracking-[0.03em]">
          Verify your email
        </h1>
        <Suspense fallback={<div className="text-body-md text-warm-gray text-center">Loading...</div>}>
          <VerifyEmailForm />
        </Suspense>
        <p className="text-center text-body-md text-warm-gray mt-sm">
          Already verified?{' '}
          <a href="/login" className="text-brown underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
