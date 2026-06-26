import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelector } from 'react-redux';
import SignupForm from './SignupForm';
import { showToast } from '@/lib/toast';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/store/authThunk', () => ({
  signupThunk: jest.fn(),
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

describe('SignupForm', () => {
  const mockUnwrap = jest.fn();
  const mockDispatch = jest.fn().mockReturnValue({ unwrap: mockUnwrap });

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector: any) =>
      selector({ auth: { signupLoading: false } }),
    );
  });

  it('renders Full Name, Email, Password, Confirm Password, and Phone fields', () => {
    render(<SignupForm />);

    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 8 characters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repeat password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+1 (555) 000-0000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /begin your journey/i })).toBeInTheDocument();
  });

  it('does not render a birth date field', () => {
    render(<SignupForm />);
    expect(screen.queryByLabelText(/birth/i)).not.toBeInTheDocument();
  });

  it('redirects to verify-email with encoded email and shows success toast on successful signup', async () => {
    mockUnwrap.mockResolvedValue({});
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password1!');
    await user.type(screen.getByPlaceholderText('Repeat password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: /begin your journey/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/verify-email?email=test%40example.com',
      );
    });
    expect(showToast.success).toHaveBeenCalledWith(
      'Check your email for a 6-digit code',
    );
  });

  it('shows inline email error on 409 conflict and does not call showToast.error', async () => {
    mockUnwrap.mockRejectedValue('Email already exists');
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'taken@example.com');
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password1!');
    await user.type(screen.getByPlaceholderText('Repeat password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: /begin your journey/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An account with this email already exists.',
      );
    });
    expect(showToast.error).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('calls showToast.error for non-409 API errors', async () => {
    mockUnwrap.mockRejectedValue('Signup failed');
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText('Jane Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password1!');
    await user.type(screen.getByPlaceholderText('Repeat password'), 'Password1!');
    await user.click(screen.getByRole('button', { name: /begin your journey/i }));

    await waitFor(() => {
      expect(showToast.error).toHaveBeenCalledWith('Signup failed');
    });
  });
});
