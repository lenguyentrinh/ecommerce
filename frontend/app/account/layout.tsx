'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const navLink =
  'text-label-sm uppercase tracking-widest w-fit pb-1 transition-colors duration-200';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authChecked } = useRequireAuth();
  const pathname = usePathname();

  if (!authChecked) {
    return (
      <div className="account-mesh flex flex-1 items-center justify-center">
        <p className="text-body-md text-warm-gray">Loading your account...</p>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const onProfile = pathname === '/account';
  const onAddresses = pathname.startsWith('/account/addresses');

  return (
    <div className="account-mesh flex flex-1 flex-col md:flex-row">
      {/* Editorial fixed glass rail — desktop only (Stitch editorial-split-anchor, 30%) */}
      <aside className="hidden md:block md:w-[30%] md:shrink-0">
        <div className="glass-panel sticky top-20 flex h-[calc(100dvh-80px)] flex-col border-r border-hairline/20 px-lg py-xl">
          <p className="mb-xs text-[10px] font-bold uppercase tracking-[0.2em] text-brown">
            Account
          </p>
          <h2 className="mb-md text-headline-md leading-snug text-brown">
            An invitation to
            <br />
            the art of dressing
          </h2>
          <nav className="flex flex-col gap-sm">
            <Link
              href="/account"
              aria-current={onProfile ? 'page' : undefined}
              className={`${navLink} ${onProfile ? 'border-b border-brown font-bold text-brown' : 'text-warm-gray hover:text-brown'}`}
            >
              Profile
            </Link>
            <Link
              href="/account/addresses"
              aria-current={onAddresses ? 'page' : undefined}
              className={`${navLink} ${onAddresses ? 'border-b border-brown font-bold text-brown' : 'text-warm-gray hover:text-brown'}`}
            >
              Addresses
            </Link>
            <span
              aria-disabled="true"
              title="Coming soon"
              className={`${navLink} cursor-not-allowed text-warm-gray/40`}
            >
              Security
            </span>
          </nav>
        </div>
      </aside>

      {/* Content — right 70%, inner column capped at 800px (Stitch editorial-split-content) */}
      <section className="flex-1 px-md py-xl md:px-lg">
        <div className="mx-auto max-w-[800px]">{children}</div>
      </section>
    </div>
  );
}
