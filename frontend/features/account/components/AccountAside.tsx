import Link from 'next/link';

// Stitch right column (0.8fr) of the asymmetric grid. The canonical screen shows
// a membership/rewards card backed by data we don't have, so this is an editorial
// brand card with real navigation only (no fabricated points or status).
export default function AccountAside() {
  return (
    <aside className="account-rise flex flex-col gap-xs rounded-xl bg-sand/80 p-md soft-shadow md:p-lg">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray">
        The Oren Atelier
      </p>
      <h3 className="text-[20px] font-semibold text-brown">Private Styling</h3>
      <p className="mt-xs text-body-md leading-relaxed text-warm-gray">
        Every Oren piece is finished by hand. Speak with a personal stylist to
        shape your next collection.
      </p>
      <Link
        href="/"
        className="mt-md w-fit border-b border-brown pb-0.5 text-label-sm uppercase tracking-widest text-brown transition-colors hover:text-warm-gray"
      >
        Return to the shop
      </Link>
    </aside>
  );
}
