'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const navLink =
  'text-label-sm uppercase tracking-widest w-fit pb-1 transition-all duration-200';

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

  const railLink = (active: boolean) =>
    `${navLink} ${active ? 'translate-x-1 border-b border-brown font-bold text-brown' : 'text-warm-gray hover:translate-x-1 hover:text-brown'}`;

  return (
    <div className="account-mesh flex flex-1 flex-col md:flex-row">
      {/* Fixed editorial rail: Stitch SideNavBar (220px, portrait pinned bottom) */}
      <aside className="hidden md:block md:w-[220px] md:shrink-0">
        <div className="sticky top-20 flex h-[calc(100dvh-80px)] flex-col border-r border-hairline/20 bg-warm-white/70 px-md py-lg backdrop-blur-md">
          <div className="mb-md">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray">
              Account
            </p>
            <h2 className="text-[20px] font-bold uppercase leading-tight tracking-wide text-brown">
              Curated
              <br />
              Selections
            </h2>
          </div>

          <nav className="flex flex-col gap-sm">
            <Link href="/account" aria-current={onProfile ? 'page' : undefined} className={railLink(onProfile)}>
              Profile
            </Link>
            <span
              aria-disabled="true"
              title="Coming soon"
              className={`${navLink} cursor-not-allowed text-warm-gray/40`}
            >
              Security
            </span>
          </nav>

          {/* Editorial portrait, grayscale → color on hover (Stitch) */}
          <div className="mt-auto h-[180px] w-full overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/account-editorial.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
            />
          </div>
        </div>
      </aside>

      {/* Content: Stitch main area; inner column widened for the asymmetric grid */}
      <section className="flex-1 px-md py-10 md:px-lg">
        <div className="mx-auto w-full max-w-[1200px]">
          {/* Mobile account nav: the rail is desktop-only, so nav survives below md */}
          <nav className="mb-lg flex items-center gap-lg border-b border-hairline/30 pb-sm md:hidden">
            <Link href="/account" aria-current={onProfile ? 'page' : undefined} className={railLink(onProfile)}>
              Profile
            </Link>
            <span
              aria-disabled="true"
              title="Coming soon"
              className={`${navLink} cursor-not-allowed text-warm-gray/40`}
            >
              Security
            </span>
          </nav>
          {children}
        </div>
      </section>
    </div>
  );
}
