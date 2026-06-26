'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import ProfileSection from '@/features/account/components/ProfileSection';
import AddressSection from '@/features/account/components/AddressSection';

export default function AccountPage() {
  const { isAuthenticated, authChecked } = useRequireAuth();

  // Wait for session hydration so there's no flash-redirect on first load.
  if (!authChecked) {
    return (
      <div className="flex flex-1 items-center justify-center bg-ivory">
        <p className="text-body-md text-warm-gray">Loading your account...</p>
      </div>
    );
  }

  // Hook redirects to /login?return=/account when unauthenticated.
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-1 flex-col bg-ivory px-md py-lg">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-md">
        <h1 className="text-display-lg text-brown">My Account</h1>

        <ProfileSection />
        <AddressSection />

        {/* Order History — the /orders route arrives in Epic 4 */}
        <section className="bg-surface rounded-xl shadow-ambient p-md">
          <h2 className="text-headline-md text-brown tracking-[0.03em] mb-sm">Order History</h2>
          <Link
            href="/orders"
            className="text-body-md font-semibold text-clay underline transition-colors hover:text-brown"
          >
            View your orders
          </Link>
        </section>
      </div>
    </div>
  );
}
