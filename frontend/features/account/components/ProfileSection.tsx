'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector, useDispatch } from 'react-redux';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import { AppDispatch, RootState } from '@/store/store';
import { updateProfileThunk } from '@/store/authThunk';
import { showToast } from '@/lib/toast';
import { profileSchema, type ProfileValues } from '@/lib/validation/accountSchemas';

export default function ProfileSection() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    mode: 'onTouched',
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: user?.userName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  });

  const onSubmit = async (data: ProfileValues) => {
    try {
      await dispatch(updateProfileThunk(data)).unwrap();
      showToast.success('Profile updated');
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <section className="bg-surface rounded-xl shadow-ambient p-md">
      <h2 className="text-headline-md text-brown tracking-[0.03em] mb-md">Profile</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-sm" noValidate>
        <InputField
          id="userName"
          required
          label="Name"
          type="text"
          placeholder="Jane Doe"
          error={errors.userName?.message}
          {...register('userName')}
        />

        {/* Email is immutable — read-only, never submitted */}
        <InputField
          id="email"
          label="Email"
          type="email"
          value={user?.email ?? ''}
          readOnly
          disabled
        />

        <InputField
          id="phoneNumber"
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 000-0000"
          error={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full mt-xs">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </section>
  );
}
