'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector, useDispatch } from 'react-redux';
import InputField from '@/components/InputField';
import { AppDispatch, RootState } from '@/store/store';
import { updateProfileThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';
import { profileSchema, type ProfileValues } from '@/lib/validation/accountSchemas';

// The auth model stores a single `userName`; the Stitch profile form edits it
// as First + Last name. Split on load, re-join on save (non-breaking).
function splitName(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

export default function ProfileSection() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { firstName, lastName } = splitName(user?.userName);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    mode: 'onTouched',
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName, lastName, phoneNumber: user?.phoneNumber ?? '' },
  });

  const onSubmit = async (data: ProfileValues) => {
    const userName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    try {
      await dispatch(updateProfileThunk({ userName, phoneNumber: data.phoneNumber })).unwrap();
      showToast.success('Profile updated');
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <div className="account-rise mb-xl">
      <header className="mb-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brown">
          Personal Details
        </p>
        <h1 className="mt-xs text-display-lg text-brown">Profile</h1>
      </header>

      <div className="glass-panel soft-shadow rounded-xl p-lg md:p-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg" noValidate>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <InputField
              id="firstName"
              variant="editorial"
              required
              label="First Name"
              type="text"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <InputField
              id="lastName"
              variant="editorial"
              label="Last Name"
              type="text"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          {/* Email is immutable — read-only, never submitted */}
          <InputField
            id="email"
            variant="editorial"
            label="Email Address"
            type="email"
            value={user?.email ?? ''}
            readOnly
            disabled
          />

          <InputField
            id="phoneNumber"
            variant="editorial"
            label="Phone Number"
            type="tel"
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />

          <div className="flex justify-end border-t border-brown/10 pt-xl">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brown px-xl py-md text-label-sm uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
