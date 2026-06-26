import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressSection from './AddressSection';
import { showToast } from '@/lib/toast';
import { getAddressesAPI, createAddressAPI } from '@/services/usersAPI';

const mockPush = jest.fn();
let mockId: string | null = null;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => mockId }),
}));

jest.mock('@/services/usersAPI', () => ({
  getAddressesAPI: jest.fn(),
  createAddressAPI: jest.fn(),
  editAddressAPI: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

describe('AddressSection (Stitch address form)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockId = null;
    (getAddressesAPI as jest.Mock).mockResolvedValue([]);
  });

  it('renders the address form fields in add mode', () => {
    render(<AddressSection />);
    expect(screen.getByRole('heading', { name: /add address/i })).toBeInTheDocument();
    expect(screen.getByLabelText('First Name', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Street Address', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('City', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Postal Code', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Country', { exact: false })).toBeInTheDocument();
  });

  it('saves a new address, toasts "Address saved", and returns to /account (AC3)', async () => {
    (createAddressAPI as jest.Mock).mockResolvedValue({ id: 5 });
    const user = userEvent.setup();
    render(<AddressSection />);

    await user.type(screen.getByLabelText('First Name', { exact: false }), 'Elena');
    await user.type(screen.getByLabelText('Last Name', { exact: false }), 'Moretti');
    await user.type(screen.getByLabelText('Street Address', { exact: false }), 'Via della Spiga, 7');
    await user.type(screen.getByLabelText('City', { exact: false }), 'Milano');
    await user.type(screen.getByLabelText('Postal Code', { exact: false }), '20121');
    await user.selectOptions(screen.getByLabelText('Country', { exact: false }), 'Italy');
    await user.click(screen.getByRole('button', { name: /save address/i }));

    await waitFor(() => {
      expect(showToast.success).toHaveBeenCalledWith('Address saved');
    });
    expect(createAddressAPI).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/account');
  });
});
