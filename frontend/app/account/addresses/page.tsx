import { Suspense } from 'react';
import AddressSection from '@/features/account/components/AddressSection';

// Auth gating + the editorial sidebar live in app/account/layout.tsx.
export default function AddressesPage() {
  return (
    <Suspense
      fallback={<div className="text-body-md text-warm-gray">Loading...</div>}
    >
      <AddressSection />
    </Suspense>
  );
}
