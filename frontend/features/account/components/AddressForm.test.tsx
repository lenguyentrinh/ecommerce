import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressForm from './AddressForm';
import { showToast } from '@/lib/toast';
import { getAddressesAPI, createAddressAPI } from '@/services/usersAPI';

jest.mock('@/services/usersAPI', () => ({
  getAddressesAPI: jest.fn(),
  createAddressAPI: jest.fn(),
  editAddressAPI: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

describe('AddressForm (Stitch address form)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAddressesAPI as jest.Mock).mockResolvedValue([]);
  });

  it('renders the address form fields in add mode', () => {
    render(<AddressForm addressId={null} onSuccess={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('heading', { name: /add address/i })).toBeInTheDocument();
    expect(screen.getByLabelText('First Name', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('Street Address', { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText('City', { exact: false })).toBeInTheDocument();
    expect(screen.queryByLabelText('Postal Code', { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Country', { exact: false })).not.toBeInTheDocument();
  });

  it('saves a new address, toasts "Address saved", and calls onSuccess (AC3)', async () => {
    (createAddressAPI as jest.Mock).mockResolvedValue({ id: 5 });
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    render(<AddressForm addressId={null} onSuccess={onSuccess} onCancel={jest.fn()} />);

    await user.type(screen.getByLabelText('First Name', { exact: false }), 'Elena');
    await user.type(screen.getByLabelText('Last Name', { exact: false }), 'Moretti');
    await user.type(screen.getByLabelText('Street Address', { exact: false }), 'Via della Spiga, 7');
    await user.type(screen.getByLabelText('City', { exact: false }), 'Milano');
    await user.click(screen.getByRole('button', { name: /save address/i }));

    await waitFor(() => expect(showToast.success).toHaveBeenCalledWith('Address saved'));
    expect(createAddressAPI).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(<AddressForm addressId={null} onSuccess={jest.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
