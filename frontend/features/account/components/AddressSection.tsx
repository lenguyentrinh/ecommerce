'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import InputField from '@/components/InputField';
import { showToast } from '@/lib/toast';
import {
  getAddressesAPI,
  createAddressAPI,
  editAddressAPI,
  type AddressPayload,
} from '@/services/usersAPI';
import { addressSchema, type AddressValues } from '@/lib/validation/accountSchemas';

const COUNTRIES = ['Italy', 'France', 'United States', 'United Kingdom', 'Japan'];

const EMPTY: AddressValues = {
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

const editorialSelect =
  'w-full border-0 border-b-2 border-brown/20 bg-transparent py-2 text-body-md font-bold text-brown outline-none transition-colors focus:border-brown appearance-none';

export default function AddressSection() {
  const router = useRouter();
  const editId = Number(useSearchParams().get('id')) || null;
  const isEditing = editId !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    mode: 'onTouched',
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
  });

  // In edit mode, load the target address into the form.
  useEffect(() => {
    if (!isEditing) return;
    let active = true;
    getAddressesAPI()
      .then((list) => {
        const a = list.find((x) => x.id === editId);
        if (active && a) {
          reset({
            firstName: a.firstName,
            lastName: a.lastName,
            street: a.street,
            city: a.city,
            postalCode: a.postalCode,
            country: a.country,
            isDefault: a.isDefault,
          });
        }
      })
      .catch((err: any) =>
        showToast.error(err.response?.data?.message || 'Could not load address'),
      );
    return () => {
      active = false;
    };
  }, [editId, isEditing, reset]);

  const onSubmit = async (data: AddressValues) => {
    try {
      if (isEditing) {
        await editAddressAPI(editId, data as AddressPayload);
        showToast.success('Address updated');
      } else {
        await createAddressAPI(data as AddressPayload);
        showToast.success('Address saved');
      }
      router.push('/account');
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Could not save address');
    }
  };

  return (
    <div className="account-rise">
      <header className="mb-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brown">
          Shipping &amp; Billing
        </p>
        <h1 className="mt-xs text-display-lg text-brown">Addresses</h1>
      </header>

      <div className="glass-panel soft-shadow rounded-xl p-lg md:p-xl">
        <h2 className="mb-xl border-b border-brown/10 pb-4 text-headline-md text-brown">
          {isEditing ? 'Edit Address' : 'Add Address'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg" noValidate>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <InputField
              id="firstName"
              variant="editorial"
              required
              label="First Name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <InputField
              id="lastName"
              variant="editorial"
              required
              label="Last Name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <InputField
            id="street"
            variant="editorial"
            required
            label="Street Address"
            error={errors.street?.message}
            {...register('street')}
          />

          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <InputField
              id="city"
              variant="editorial"
              required
              label="City"
              error={errors.city?.message}
              {...register('city')}
            />
            <InputField
              id="postalCode"
              variant="editorial"
              required
              label="Postal Code"
              error={errors.postalCode?.message}
              {...register('postalCode')}
            />
            <div className="flex flex-col gap-xs">
              <label
                htmlFor="country"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-brown"
              >
                Country<span className="text-error-strong"> *</span>
              </label>
              <select id="country" className={editorialSelect} defaultValue="" {...register('country')}>
                <option value="" disabled>
                  Select
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country && (
                <span role="alert" className="text-[12px] text-error-strong">
                  {errors.country.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-sm pt-md">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-sm border-2 border-brown text-brown focus:ring-0"
              {...register('isDefault')}
            />
            <span className="text-label-sm uppercase tracking-widest text-brown">
              Set as default shipping address
            </span>
          </div>

          <div className="flex flex-col justify-end gap-md border-t border-brown/10 pt-xl md:flex-row">
            <button
              type="button"
              onClick={() => router.push('/account')}
              className="px-lg py-md text-label-sm uppercase tracking-widest text-brown hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brown px-xl py-md text-label-sm uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
