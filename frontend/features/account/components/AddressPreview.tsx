'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import { showToast } from '@/lib/toast';
import { getAddressesAPI, type Address } from '@/services/usersAPI';

export default function AddressPreview() {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    let active = true;
    getAddressesAPI()
      .then((list) => active && setAddresses(list))
      .catch((err: any) =>
        showToast.error(err.response?.data?.message || 'Could not load addresses'),
      );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="account-rise">
      <header className="mb-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brown">
          Shipping &amp; Billing
        </p>
        <h2 className="mt-xs text-display-lg text-brown">Addresses</h2>
      </header>

      <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="glass-panel soft-shadow flex min-h-[200px] flex-col justify-between rounded-xl p-lg"
          >
            <div className="flex items-start justify-between">
              {a.isDefault ? (
                <span className="bg-brown px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Default
                </span>
              ) : (
                <span />
              )}
              <Link
                href={`/account/addresses?id=${a.id}`}
                aria-label={`Edit address on ${a.street}`}
                className="text-warm-gray/50 transition-colors hover:text-brown"
              >
                <FiEdit2 size={18} />
              </Link>
            </div>
            <div className="mt-sm space-y-1">
              <p className="font-bold text-brown">{a.street}</p>
              <p className="text-warm-gray">
                {a.postalCode} {a.city}
              </p>
              <p className="text-warm-gray">{a.country}</p>
            </div>
          </div>
        ))}

        {addresses.length < 2 && (
          <Link
            href="/account/addresses"
            className="glass-panel group flex flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed border-hairline/60 p-lg text-warm-gray/50 transition-colors hover:border-brown/30 hover:text-brown"
          >
            <FiPlus size={28} />
            <span className="text-label-sm uppercase tracking-widest">Add New Address</span>
          </Link>
        )}
      </div>
    </div>
  );
}
