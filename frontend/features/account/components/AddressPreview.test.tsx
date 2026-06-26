import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressPreview from './AddressPreview';
import {
  getAddressesAPI,
  deleteAddressAPI,
  setDefaultAddressAPI,
} from '@/services/usersAPI';
import { showToast } from '@/lib/toast';

jest.mock('@/services/usersAPI', () => ({
  getAddressesAPI: jest.fn(),
  deleteAddressAPI: jest.fn(),
  setDefaultAddressAPI: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() },
}));

// The modal is exercised in AddressFormModal.test; here we only assert that the
// add/edit triggers open it with the right addressId.
jest.mock('./AddressFormModal', () => ({
  __esModule: true,
  default: ({ addressId }: { addressId: number | null }) => (
    <div role="dialog">address modal id={String(addressId)}</div>
  ),
}));

const addresses = [
  {
    id: 1,
    firstName: 'Elara',
    lastName: 'Vance',
    street: '1 Editorial Lane',
    city: 'Milano',
    isDefault: true,
  },
  {
    id: 2,
    firstName: 'Elara',
    lastName: 'Vance',
    street: '2 Archive Street',
    city: 'Roma',
    isDefault: false,
  },
];

describe('AddressPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAddressesAPI as jest.Mock).mockResolvedValue(addresses);
  });

  it('renders saved addresses, a DEFAULT badge, and the add-new card', async () => {
    render(<AddressPreview />);
    expect(await screen.findByText('1 Editorial Lane')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new address/i })).toBeInTheDocument();
  });

  it('opens the address modal in add mode (no id)', async () => {
    const user = userEvent.setup();
    render(<AddressPreview />);
    await screen.findByText('1 Editorial Lane');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add new address/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent('id=null');
  });

  it('opens the modal in edit mode with the chosen address id', async () => {
    const user = userEvent.setup();
    render(<AddressPreview />);
    await screen.findByText('2 Archive Street');

    await user.click(screen.getByRole('button', { name: /edit address on 2 Archive Street/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent('id=2');
  });

  it('deletes an address via the real deleteAddressAPI and removes the card', async () => {
    (deleteAddressAPI as jest.Mock).mockResolvedValue({ message: 'ok' });
    const user = userEvent.setup();
    render(<AddressPreview />);
    await screen.findByText('2 Archive Street');

    await user.click(
      screen.getByRole('button', { name: /delete address on 2 Archive Street/i }),
    );

    await waitFor(() => expect(deleteAddressAPI).toHaveBeenCalledWith(2));
    expect(showToast.success).toHaveBeenCalledWith('Address removed');
    await waitFor(() =>
      expect(screen.queryByText('2 Archive Street')).not.toBeInTheDocument(),
    );
  });

  it('promotes a non-default address via setDefaultAddressAPI', async () => {
    (setDefaultAddressAPI as jest.Mock).mockResolvedValue([
      { ...addresses[0], isDefault: false },
      { ...addresses[1], isDefault: true },
    ]);
    const user = userEvent.setup();
    render(<AddressPreview />);
    await screen.findByText('2 Archive Street');

    await user.click(screen.getByRole('button', { name: /set as default/i }));

    await waitFor(() => expect(setDefaultAddressAPI).toHaveBeenCalledWith(2));
    expect(showToast.success).toHaveBeenCalledWith('Default address updated');
  });
});
