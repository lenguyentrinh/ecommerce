import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelector } from 'react-redux';
import LoginForm from './LoginForm';
import { showToast } from '@/lib/toast';

const mockPush = jest.fn();
let mockReturnParam: string | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => mockReturnParam }),
}));

jest.mock('@/store/authThunk', () => ({
  loginThunk: jest.fn(),
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

describe('LoginForm', () => {
  const mockUnwrap = jest.fn();
  const mockDispatch = jest.fn().mockReturnValue({ unwrap: mockUnwrap });

  beforeEach(() => {
    jest.clearAllMocks();
    mockReturnParam = null;
    mockDispatch.mockReturnValue({ unwrap: mockUnwrap });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector: any) =>
      selector({ auth: { loginLoading: false } }),
    );
  });

  it('renders Email, Password fields and the Sign In button', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('logs in, shows "Welcome back!" toast and redirects home on success', async () => {
    mockUnwrap.mockResolvedValue({ message: 'Login successful' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
    expect(showToast.success).toHaveBeenCalledWith('Welcome back!');
  });

  it('redirects to the return URL when present', async () => {
    mockReturnParam = '/account';
    mockUnwrap.mockResolvedValue({ message: 'Login successful' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/account');
    });
  });

  it('ignores an unsafe (non-relative) return URL', async () => {
    mockReturnParam = 'https://evil.com';
    mockUnwrap.mockResolvedValue({ message: 'Login successful' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows "Invalid email or password." inline and clears password on Invalid credentials', async () => {
    mockUnwrap.mockRejectedValue('Invalid credentials');
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    const passwordInput = screen.getByPlaceholderText('Your password') as HTMLInputElement;
    await user.type(passwordInput, 'WrongPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });
    expect(passwordInput.value).toBe('');
    expect(showToast.error).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows "Please verify your email first." inline on Email not verified', async () => {
    mockUnwrap.mockRejectedValue('Email not verified');
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please verify your email first.');
    });
    expect(showToast.error).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
