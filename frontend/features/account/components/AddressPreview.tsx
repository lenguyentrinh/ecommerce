'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { showToast } from '@/lib/toast';
import {
  getAddressesAPI,
  deleteAddressAPI,
  setDefaultAddressAPI,
  type Address,
} from '@/services/usersAPI';
import AddressFormModal from './AddressFormModal';

// Stitch "SAVED SHIPPING ADDRESSES": 3-col grid of glass cards with hover
// edit/delete, a DEFAULT badge / SET AS DEFAULT action, and an add card.
// Add/edit open AddressFormModal in-page (no navigation away).
export default function AddressPreview() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(() => {
    getAddressesAPI()
      .then(setAddresses)
      .catch((err: any) =>
        showToast.error(err.response?.data?.message || 'Could not load addresses'),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditId(null);
    setFormOpen(true);
  };
  const openEdit = (id: number) => {
    setEditId(id);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAddressAPI(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast.success('Address removed');
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Could not remove address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const list = await setDefaultAddressAPI(id);
      setAddresses(list);
      showToast.success('Default address updated');
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Could not update default');
    }
  };

  return (
    <section id="addresses" className="account-rise mt-lg">
      <h2 className="mb-md text-[20px] font-semibold uppercase tracking-[0.05em] text-brown">
        Saved Shipping Addresses
      </h2>

      <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="glass-panel soft-shadow group flex min-h-[180px] flex-col justify-between rounded-xl p-md"
          >
            <div>
              <div className="mb-sm flex items-center justify-between">
                {a.isDefault ? (
                  <span className="rounded-full border border-brown px-2 py-[1px] text-[9px] font-bold uppercase tracking-widest text-brown">
                    Default
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex gap-sm text-warm-gray/60 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(a.id)}
                    aria-label={`Edit address on ${a.street}`}
                    className="transition-colors hover:text-brown"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    aria-label={`Delete address on ${a.street}`}
                    className="transition-colors hover:text-error-strong"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-label-sm uppercase tracking-widest text-brown">
                {a.firstName} {a.lastName}
              </p>
              <address className="mt-xs space-y-0.5 not-italic text-[14px] leading-tight text-warm-gray">
                <span className="block">{a.street}</span>
                <span className="block">{a.city}</span>
              </address>
            </div>

            {!a.isDefault && (
              <button
                type="button"
                onClick={() => handleSetDefault(a.id)}
                className="mt-sm text-left text-[9px] font-bold uppercase tracking-widest text-warm-gray transition-colors hover:text-brown"
              >
                Set as default
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={openAdd}
          className="group flex min-h-[180px] w-full flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed border-hairline/60 p-md text-warm-gray/60 transition-colors hover:border-brown/40 hover:text-brown"
        >
          <FiPlus size={24} className="transition-transform group-hover:scale-110" />
          <span className="text-label-sm uppercase tracking-widest">Add New Address</span>
        </button>
      </div>

      {formOpen && (
        <AddressFormModal
          addressId={editId}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </section>
  );
}
