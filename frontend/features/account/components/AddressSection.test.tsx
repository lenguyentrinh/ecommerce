import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressSection from './AddressSection';
import { showToast } from '@/lib/toast';
import {
  getAddressesAPI,
  createAddressAPI,
  deleteAddressAPI,
} from '@/services/usersAPI';

jest.mock('@/services/usersAPI', () => ({
  getAddressesAPI: jest.fn(),
  createAddressAPI: jest.fn(),
  deleteAddressAPI: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

const addr = (id: number, fullName: string) => ({
  id,
  fullName,
  line1: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  postalCode: '62704',
  country: 'USA',
});

describe('AddressSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAddressesAPI as jest.Mock).mockResolvedValue([]);
  });

  it('lists addresses fetched on mount', async () => {
    (getAddressesAPI as jest.Mock).mockResolvedValue([addr(1, 'Jane Doe')]);
    render(<AddressSection />);
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });

  it('adds an address, appends it, and toasts "Address saved" (AC3)', async () => {
    (getAddressesAPI as jest.Mock).mockResolvedValue([]);
    (createAddressAPI as jest.Mock).mockResolvedValue(addr(5, 'New Person'));
    const user = userEvent.setup();
    render(<AddressSection />);

    // Required fields render their label with a trailing " *", so match loosely.
    await user.type(await screen.findByLabelText('Full Name', { exact: false }), 'New Person');
    await user.type(screen.getByLabelText('Address Line 1', { exact: false }), '123 Main St');
    await user.type(screen.getByLabelText('City', { exact: false }), 'Springfield');
    await user.type(screen.getByLabelText('State', { exact: false }), 'IL');
    await user.type(screen.getByLabelText('Postal Code', { exact: false }), '62704');
    await user.type(screen.getByLabelText('Country', { exact: false }), 'USA');
    await user.click(screen.getByRole('button', { name: /add address/i }));

    await waitFor(() => {
      expect(showToast.success).toHaveBeenCalledWith('Address saved');
    });
    expect(screen.getByText('New Person')).toBeInTheDocument();
  });

  it('hides the add form and shows the max note when 2 addresses exist (AC3)', async () => {
    (getAddressesAPI as jest.Mock).mockResolvedValue([addr(1, 'A One'), addr(2, 'B Two')]);
    render(<AddressSection />);

    expect(await screen.findByText('Maximum 2 addresses reached')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add address/i })).not.toBeInTheDocument();
  });

  it('removes an address and toasts "Address removed" (AC4)', async () => {
    (getAddressesAPI as jest.Mock).mockResolvedValue([addr(1, 'Jane Doe')]);
    (deleteAddressAPI as jest.Mock).mockResolvedValue({ message: 'Address removed' });
    const user = userEvent.setup();
    render(<AddressSection />);

    await user.click(await screen.findByRole('button', { name: /remove address for jane doe/i }));

    await waitFor(() => {
      expect(showToast.success).toHaveBeenCalledWith('Address removed');
    });
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
