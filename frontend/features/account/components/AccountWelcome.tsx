'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// Stitch main header: "Welcome back, {firstName}." with an editorial subline.
// No member-since date is shown: the user model carries no created date and
// fabricating one would break the "real data only" rule.
export default function AccountWelcome() {
  const user = useSelector((state: RootState) => state.auth.user);
  const firstName = (user?.userName ?? '').trim().split(/\s+/)[0] || 'there';

  return (
    <header className="account-rise mb-md">
      <h1 className="text-[36px] font-bold leading-tight tracking-[0.02em] text-brown">
        Welcome back, {firstName}.
      </h1>
      <p className="mt-xs text-body-md italic text-warm-gray">Your private atelier.</p>
    </header>
  );
}
