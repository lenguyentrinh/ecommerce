"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import InputField from "@/components/InputField";
import { AppDispatch, RootState } from "@/store/store";
import { verifyOtpThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { forgotOtpSchema, type ForgotOtpValues } from "@/lib/validation/authSchemas";

export default function OtpForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { verifyOtpLoading } = useSelector((state: RootState) => state.auth);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ForgotOtpValues>({ mode: "onTouched", resolver: zodResolver(forgotOtpSchema) });

  const onSubmit = async (data: ForgotOtpValues) => {
    try {
      const result = await dispatch(
        verifyOtpThunk({ ...data, email: email || "" }),
      ).unwrap();
      showToast.success(result?.message || "OTP verified successfully");
      router.push("/forgotPassword/reset?email=" + email);
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5" noValidate>
      {email && (
        <p className="text-center text-body-md text-warm-gray">
          We sent a code to <span className="font-semibold text-brown">{email}</span>
        </p>
      )}

      <InputField
        id="otp"
        variant="glass"
        required
        label="Verification Code"
        type="text"
        placeholder="123456"
        inputMode="numeric"
        error={errors.otp?.message}
        {...register("otp")}
      />

      <button
        type="submit"
        disabled={verifyOtpLoading}
        className="btn-vivid group flex w-full items-center justify-center gap-sm rounded-full py-4 text-headline-md text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifyOtpLoading ? "Verifying..." : "Verify"}
        {!verifyOtpLoading && (
          <FiArrowRight
            size={22}
            className="transition-transform duration-500 group-hover:translate-x-2"
          />
        )}
      </button>
    </form>
  );
}
