import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useRequireAuth } from './useRequireAuth';

const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/account',
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

function TestComponent() {
  useRequireAuth();
  return null;
}

function mockAuth(state: { isAuthenticated: boolean; authChecked: boolean }) {
  (useSelector as jest.Mock).mockImplementation((selector: any) =>
    selector({ auth: state }),
  );
}

describe('useRequireAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does NOT redirect while hydration is pending (authChecked false)', () => {
    mockAuth({ isAuthenticated: false, authChecked: false });
    render(<TestComponent />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /login with return path when unauthenticated after hydration', () => {
    mockAuth({ isAuthenticated: false, authChecked: true });
    render(<TestComponent />);
    expect(mockReplace).toHaveBeenCalledWith('/login?return=%2Faccount');
  });

  it('does NOT redirect when authenticated', () => {
    mockAuth({ isAuthenticated: true, authChecked: true });
    render(<TestComponent />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
