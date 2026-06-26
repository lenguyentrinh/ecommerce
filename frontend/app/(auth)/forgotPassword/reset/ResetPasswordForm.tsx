"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import InputField from "@/components/InputField";
import { AppDispatch, RootState } from "@/store/store";
import { resetPasswordThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/authSchemas";

const eyeToggleClass =
  "absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/50 transition-colors hover:text-brown";

export default function ResetPasswordForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { resetPasswordLoading } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ mode: "onTouched", resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordValues) => {
    try {
      const result = await dispatch(
        resetPasswordThunk({ ...data, email: email || "" }),
      ).unwrap();
      showToast.success(result?.message || "Password reset successfully");
      router.push("/login");
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5" noValidate>
      <InputField
        id="newPassword"
        variant="glass"
        required
        label="New Password"
        type={showPassword ? "text" : "password"}
        placeholder="Min. 6 characters"
        error={errors.newPassword?.message}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className={eyeToggleClass}
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        }
        {...register("newPassword")}
      />

      <InputField
        id="confirmNewPassword"
        variant="glass"
        required
        label="Confirm Password"
        type={showConfirm ? "text" : "password"}
        placeholder="Repeat password"
        error={errors.confirmNewPassword?.message}
        trailing={
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className={eyeToggleClass}
          >
            {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        }
        {...register("confirmNewPassword")}
      />

      <button
        type="submit"
        disabled={resetPasswordLoading}
        className="btn-vivid group flex w-full items-center justify-center gap-sm rounded-full py-4 text-headline-md text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resetPasswordLoading ? "Resetting..." : "Reset Password"}
        {!resetPasswordLoading && (
          <FiArrowRight
            size={22}
            className="transition-transform duration-500 group-hover:translate-x-2"
          />
        )}
      </button>
    </form>
  );
}
