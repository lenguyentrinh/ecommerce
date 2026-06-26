import React from 'react';
import { render, screen } from '@testing-library/react';
import AccountLayout from './layout';
import { useRequireAuth } from '@/hooks/useRequireAuth';

jest.mock('@/hooks/useRequireAuth', () => ({ useRequireAuth: jest.fn() }));

let mockPath = '/account';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

describe('AccountLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPath = '/account';
  });

  it('shows a loading state while auth is unresolved', () => {
    (useRequireAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, authChecked: false });
    render(
      <AccountLayout>
        <div>child</div>
      </AccountLayout>,
    );
    expect(screen.getByText(/loading your account/i)).toBeInTheDocument();
    expect(screen.queryByText('child')).not.toBeInTheDocument();
  });

  it('renders nothing once checked but unauthenticated (hook redirects)', () => {
    (useRequireAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, authChecked: true });
    const { container } = render(
      <AccountLayout>
        <div>child</div>
      </AccountLayout>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the account nav (desktop rail + mobile bar) and children when authenticated (AC1)', () => {
    (useRequireAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, authChecked: true });
    render(
      <AccountLayout>
        <div>child</div>
      </AccountLayout>,
    );
    // Nav is rendered twice (desktop rail + mobile bar); CSS hides one per breakpoint.
    expect(screen.getAllByRole('link', { name: 'Profile' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Security').length).toBeGreaterThan(0);
    // Addresses live on the account page now (no separate nav link).
    expect(screen.queryByRole('link', { name: 'Addresses' })).not.toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
