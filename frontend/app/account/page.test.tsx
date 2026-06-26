import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountPage from './page';

// Auth gating + rail live in layout.tsx (tested separately); each section has
// its own tests. The page just composes them into the Stitch layout.
jest.mock('@/features/account/components/AccountWelcome', () => ({
  __esModule: true,
  default: () => <div>AccountWelcome stub</div>,
}));
jest.mock('@/features/account/components/ProfileSection', () => ({
  __esModule: true,
  default: () => <div>ProfileSection stub</div>,
}));
jest.mock('@/features/account/components/AccountAside', () => ({
  __esModule: true,
  default: () => <div>AccountAside stub</div>,
}));
jest.mock('@/features/account/components/AddressPreview', () => ({
  __esModule: true,
  default: () => <div>AddressPreview stub</div>,
}));

describe('AccountPage', () => {
  it('composes welcome, profile, aside, and addresses (AC1)', () => {
    render(<AccountPage />);
    expect(screen.getByText('AccountWelcome stub')).toBeInTheDocument();
    expect(screen.getByText('ProfileSection stub')).toBeInTheDocument();
    expect(screen.getByText('AccountAside stub')).toBeInTheDocument();
    expect(screen.getByText('AddressPreview stub')).toBeInTheDocument();
  });
});
