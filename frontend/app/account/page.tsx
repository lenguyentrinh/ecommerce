import AccountWelcome from '@/features/account/components/AccountWelcome';
import ProfileSection from '@/features/account/components/ProfileSection';
import AccountAside from '@/features/account/components/AccountAside';
import AddressPreview from '@/features/account/components/AddressPreview';

// Stitch "Account | Profile & Addresses": welcome header, an asymmetric
// 1.2fr / 0.8fr grid (profile card beside an editorial aside), then the
// full-width saved-addresses grid. Auth gating + rail live in layout.tsx.
export default function AccountPage() {
  return (
    <>
      <AccountWelcome />
      <div className="grid grid-cols-1 items-start gap-md lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
        <ProfileSection />
        <AccountAside />
      </div>
      <AddressPreview />
    </>
  );
}
