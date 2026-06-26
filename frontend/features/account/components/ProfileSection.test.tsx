import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelector } from 'react-redux';
import ProfileSection from './ProfileSection';
import { showToast } from '@/lib/toast';

jest.mock('@/store/authThunk', () => ({
  updateProfileThunk: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

const mockUser = {
  id: 1,
  email: 'jane@example.com',
  userName: 'Jane Doe',
  phoneNumber: '+1 555 0100',
  role: 'customer',
};

describe('ProfileSection', () => {
  const mockUnwrap = jest.fn();
  const mockDispatch = jest.fn().mockReturnValue({ unwrap: mockUnwrap });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockReturnValue({ unwrap: mockUnwrap });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector: any) =>
      selector({ auth: { user: mockUser } }),
    );
  });

  it('renders the email as read-only and never editable (AC2)', () => {
    render(<ProfileSection />);
    const email = screen.getByLabelText('Email Address') as HTMLInputElement;
    expect(email).toHaveValue('jane@example.com');
    expect(email).toBeDisabled();
  });

  it('dispatches updateProfileThunk and toasts "Profile updated" on save (AC2)', async () => {
    mockUnwrap.mockResolvedValue(mockUser);
    const user = userEvent.setup();
    render(<ProfileSection />);

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
    expect(showToast.success).toHaveBeenCalledWith('Profile updated');
  });
});
