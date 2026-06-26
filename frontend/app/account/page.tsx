import ProfileSection from '@/features/account/components/ProfileSection';
import AddressPreview from '@/features/account/components/AddressPreview';

// Auth gating + the editorial sidebar live in app/account/layout.tsx.
export default function AccountPage() {
  return (
    <>
      <ProfileSection />
      <AddressPreview />
    </>
  );
}
