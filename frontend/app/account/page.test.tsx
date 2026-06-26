import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountPage from './page';

// Auth gating + sidebar live in layout.tsx (tested separately); the section
// internals have their own tests. The page just composes them.
jest.mock('@/features/account/components/ProfileSection', () => ({
  __esModule: true,
  default: () => <div>ProfileSection stub</div>,
}));
jest.mock('@/features/account/components/AddressPreview', () => ({
  __esModule: true,
  default: () => <div>AddressPreview stub</div>,
}));

describe('AccountPage', () => {
  it('composes the profile form and the addresses preview (AC1)', () => {
    render(<AccountPage />);
    expect(screen.getByText('ProfileSection stub')).toBeInTheDocument();
    expect(screen.getByText('AddressPreview stub')).toBeInTheDocument();
  });
});
