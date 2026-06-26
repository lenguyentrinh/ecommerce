import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressFormModal from './AddressFormModal';

// AddressForm has its own coverage (AddressForm.test); stub it here so the
// modal test focuses on dialog behavior (open, close affordances).
jest.mock('./AddressForm', () => ({
  __esModule: true,
  default: ({ addressId }: { addressId: number | null }) => (
    <div>form for {String(addressId)}</div>
  ),
}));

describe('AddressFormModal', () => {
  it('renders a labelled modal dialog containing the form', () => {
    render(<AddressFormModal addressId={null} onClose={jest.fn()} onSaved={jest.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('form for null')).toBeInTheDocument();
  });

  it('closes on the close button', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<AddressFormModal addressId={1} onClose={onClose} onSaved={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<AddressFormModal addressId={1} onClose={onClose} onSaved={jest.fn()} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
