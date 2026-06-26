'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '@/components/InputField';
import { showToast } from '@/lib/toast';
import {
  getAddressesAPI,
  createAddressAPI,
  editAddressAPI,
  type AddressPayload,
} from '@/services/usersAPI';
import { addressSchema, type AddressValues } from '@/lib/validation/accountSchemas';

const EMPTY: AddressValues = {
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  isDefault: false,
};

interface AddressFormProps {
  /** Address id to edit; null/undefined = add mode. */
  addressId?: number | null;
  /** Called after a successful create/edit (e.g. close modal, refresh list). */
  onSuccess: () => void;
  /** Called when the user dismisses the form without saving. */
  onCancel: () => void;
  /** id applied to the heading, so a dialog wrapper can aria-labelledby it. */
  titleId?: string;
}

// Add/edit address form (Stitch "Account | Addresses"), rendered inside the
// in-page AddressFormModal popup.
export default function AddressForm({
  addressId = null,
  onSuccess,
  onCancel,
  titleId,
}: AddressFormProps) {
  const isEditing = addressId !== null;

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
        const a = list.find((x) => x.id === addressId);
        if (active && a) {
          reset({
            firstName: a.firstName,
            lastName: a.lastName,
            street: a.street,
            city: a.city,
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
  }, [addressId, isEditing, reset]);

  const onSubmit = async (data: AddressValues) => {
    try {
      if (isEditing) {
        await editAddressAPI(addressId, data as AddressPayload);
        showToast.success('Address updated');
      } else {
        await createAddressAPI(data as AddressPayload);
        showToast.success('Address saved');
      }
      onSuccess();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || 'Could not save address');
    }
  };

  return (
    <>
      <h2
        id={titleId}
        className="mb-md border-b border-brown/10 pb-3 text-headline-md text-brown"
      >
        {isEditing ? 'Edit Address' : 'Add Address'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <InputField
            id="firstName"
            variant="editorial"
            required
            label="First Name"
            className="py-0!"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <InputField
            id="lastName"
            variant="editorial"
            required
            label="Last Name"
            className="py-0!"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <InputField
          id="street"
          variant="editorial"
          required
          label="Street Address"
          className="py-0!"
          error={errors.street?.message}
          {...register('street')}
        />

        <InputField
          id="city"
          variant="editorial"
          required
          label="City"
          className="py-0!"
          error={errors.city?.message}
          {...register('city')}
        />

        <div className="flex items-center gap-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded-sm border-2 border-brown text-brown focus:ring-0"
            {...register('isDefault')}
          />
          <span className="text-label-sm uppercase tracking-widest text-brown">
            Set as default shipping address
          </span>
        </div>

        <div className="flex flex-col justify-end gap-md border-t border-brown/10 pt-md md:flex-row">
          <button
            type="button"
            onClick={onCancel}
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
    </>
  );
}
