'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import { showToast } from '@/lib/toast';
import {
  getAddressesAPI,
  createAddressAPI,
  deleteAddressAPI,
  type Address,
} from '@/services/usersAPI';
import { addressSchema, type AddressValues } from '@/lib/validation/accountSchemas';

const MAX_ADDRESSES = 2;

export default function AddressSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({ mode: 'onTouched', resolver: zodResolver(addressSchema) });

  useEffect(() => {
    let active = true;
    getAddressesAPI()
      .then((list) => {
        if (active) setAddresses(list);
      })
      .catch((err: any) => {
        showToast.error(err.response?.data?.message || 'Could not load addresses');
      });
    return () => {
      active = false;
    };
  }, []);

  const onAdd = async (data: AddressValues) => {
    try {
      const created = await createAddressAPI(data);
      setAddresses((prev) => [...prev, created]);
      showToast.success('Address saved');
      reset();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Could not save address');
    }
  };

  const onRemove = async (id: number) => {
    try {
      await deleteAddressAPI(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast.success('Address removed');
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Could not remove address');
    }
  };

  const atLimit = addresses.length >= MAX_ADDRESSES;

  return (
    <section className="bg-surface rounded-xl shadow-ambient p-md">
      <h2 className="text-headline-md text-brown tracking-[0.03em] mb-md">Shipping Addresses</h2>

      {addresses.length === 0 && (
        <p className="text-body-md text-warm-gray mb-md">No saved addresses yet.</p>
      )}

      <ul className="flex flex-col gap-sm">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="flex items-start justify-between gap-sm rounded-lg border border-sand p-sm"
          >
            <div className="text-body-md text-brown">
              <p className="font-semibold">{a.fullName}</p>
              <p className="text-warm-gray">
                {a.line1}, {a.city}, {a.state} {a.postalCode}, {a.country}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onRemove(a.id)}
              aria-label={`Remove address for ${a.fullName}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {atLimit ? (
        <p className="text-label-sm text-warm-gray mt-md">Maximum 2 addresses reached</p>
      ) : (
        <form onSubmit={handleSubmit(onAdd)} className="mt-md flex flex-col gap-sm" noValidate>
          <InputField
            id="fullName"
            required
            label="Full Name"
            placeholder="Jane Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <InputField
            id="line1"
            required
            label="Address Line 1"
            placeholder="123 Main St"
            error={errors.line1?.message}
            {...register('line1')}
          />
          <InputField
            id="city"
            required
            label="City"
            error={errors.city?.message}
            {...register('city')}
          />
          <InputField
            id="state"
            required
            label="State"
            error={errors.state?.message}
            {...register('state')}
          />
          <InputField
            id="postalCode"
            required
            label="Postal Code"
            error={errors.postalCode?.message}
            {...register('postalCode')}
          />
          <InputField
            id="country"
            required
            label="Country"
            error={errors.country?.message}
            {...register('country')}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full mt-xs">
            {isSubmitting ? 'Saving...' : 'Add address'}
          </Button>
        </form>
      )}
    </section>
  );
}
