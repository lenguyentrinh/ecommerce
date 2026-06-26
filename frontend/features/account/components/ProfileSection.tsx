'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector, useDispatch } from 'react-redux';
import InputField from '@/components/InputField';
import EmailField from './EmailField';
import { AppDispatch, RootState } from '@/store/store';
import { updateProfileThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';
import { profileSchema, type ProfileValues } from '@/lib/validation/accountSchemas';

// Stitch "PERSONAL DETAILS" card: read-only by default, EDIT INFO unlocks the
// fields. Email is immutable. The single "Legal Name" maps 1:1 to `userName`.
export default function ProfileSection() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [editing, setEditing] = useState(false);

  const defaults = (): ProfileValues => ({
    userName: user?.userName ?? '',
    phoneNumber: user?.phoneNumber ?? '',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    mode: 'onTouched',
    resolver: zodResolver(profileSchema),
    defaultValues: defaults(),
  });

  const startEdit = () => {
    reset(defaults());
    setEditing(true);
  };
  const cancelEdit = () => {
    reset(defaults());
    setEditing(false);
  };

  const onSubmit = async (data: ProfileValues) => {
    try {
      await dispatch(
        updateProfileThunk({ userName: data.userName, phoneNumber: data.phoneNumber }),
      ).unwrap();
      showToast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <section className="account-rise glass-panel soft-shadow rounded-xl p-md md:p-lg">
      <div className="mb-md flex items-baseline justify-between">
        <h2 className="text-[20px] font-semibold uppercase tracking-[0.05em] text-brown">
          Personal Details
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="border-b border-transparent pb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray transition-colors hover:border-brown hover:text-brown"
          >
            Edit Info
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-md" noValidate>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <InputField
            id="userName"
            variant="editorial"
            required
            label="Legal Name"
            type="text"
            readOnly={!editing}
            aria-readonly={!editing}
            error={errors.userName?.message}
            {...register('userName')}
          />

          {/* Email is immutable: read-only display, truncated with a tooltip
              when the address is too long to fit. */}
          <EmailField id="email" label="Email Address" email={user?.email ?? ''} />

          {/* Phone spans the full row so the grid never leaves an empty cell */}
          <div className="md:col-span-2">
            <InputField
              id="phoneNumber"
              variant="editorial"
              label="Phone Number"
              type="tel"
              readOnly={!editing}
              aria-readonly={!editing}
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
          </div>
        </div>

        {editing && (
          <div className="flex justify-end gap-md border-t border-brown/10 pt-md">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-lg py-md text-label-sm uppercase tracking-widest text-brown hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brown px-xl py-md text-label-sm uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
