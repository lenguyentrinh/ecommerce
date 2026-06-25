import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelector } from 'react-redux';
import VerifyEmailForm from './VerifyEmailForm';
import { showToast } from '@/lib/toast';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => 'test@example.com' }),
}));

jest.mock('@/store/authThunk', () => ({
  verifyEmailThunk: jest.fn(),
  sendOtpThunk: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

describe('VerifyEmailForm', () => {
  const mockUnwrap = jest.fn();
  const mockDispatch = jest.fn().mockReturnValue({ unwrap: mockUnwrap });

  beforeEach(() => {
    jest.resetAllMocks();
    mockDispatch.mockReturnValue({ unwrap: mockUnwrap });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector: any) =>
      selector({ auth: { verifyEmailLoading: false } }),
    );
  });

  it('displays the user email from the URL param', () => {
    render(<VerifyEmailForm />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders the Resend code link', () => {
    render(<VerifyEmailForm />);
    expect(screen.getByRole('button', { name: /resend code/i })).toBeInTheDocument();
  });

  it('redirects to /login and shows success toast on valid OTP', async () => {
    mockUnwrap.mockResolvedValue({});
    const user = userEvent.setup();
    render(<VerifyEmailForm />);

    await user.type(screen.getByPlaceholderText('123456'), '123456');
    await user.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    expect(showToast.success).toHaveBeenCalledWith('Email verified! You can now log in.');
  });

  it('shows inline error on invalid or expired OTP, does not redirect', async () => {
    mockUnwrap.mockRejectedValue('Verify email failed');
    const user = userEvent.setup();
    render(<VerifyEmailForm />);

    await user.type(screen.getByPlaceholderText('123456'), '000000');
    await user.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid or expired code. Please try again.',
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows success toast on resend, does not redirect', async () => {
    const resendUnwrap = jest.fn().mockResolvedValue({});
    mockDispatch.mockReturnValue({ unwrap: resendUnwrap });
    const user = userEvent.setup();
    render(<VerifyEmailForm />);

    await user.click(screen.getByRole('button', { name: /resend code/i }));

    await waitFor(() => {
      expect(showToast.success).toHaveBeenCalledWith('Code resent. Check your inbox.');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
