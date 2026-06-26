import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountPage from './page';
import { useRequireAuth } from '@/hooks/useRequireAuth';

jest.mock('@/hooks/useRequireAuth', () => ({
  useRequireAuth: jest.fn(),
}));

// Section internals are covered by their own tests; stub them so the page test
// focuses on auth-gating + composition.
jest.mock('@/features/account/components/ProfileSection', () => ({
  __esModule: true,
  default: () => <h2>Profile</h2>,
}));
jest.mock('@/features/account/components/AddressSection', () => ({
  __esModule: true,
  default: () => <h2>Shipping Addresses</h2>,
}));

describe('AccountPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a loading state and no sections while auth is unresolved', () => {
    (useRequireAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, authChecked: false });
    render(<AccountPage />);

    expect(screen.getByText(/loading your account/i)).toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('renders nothing once checked but unauthenticated (hook redirects)', () => {
    (useRequireAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, authChecked: true });
    const { container } = render(<AccountPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the three account sections when authenticated (AC1)', () => {
    (useRequireAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, authChecked: true });
    render(<AccountPage />);

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shipping Addresses' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order History' })).toBeInTheDocument();
  });
});
