"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import InputField from "@/components/InputField";
import { AppDispatch, RootState } from "@/store/store";
import { sendOtpThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { forgotEmailSchema, type ForgotEmailValues } from "@/lib/validation/authSchemas";

export default function ForgotPasswordByEmailForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<ForgotEmailValues>({ mode: "onTouched", resolver: zodResolver(forgotEmailSchema) });
  const { sendOtpLoading } = useSelector((state: RootState) => state.auth);

  const onSubmit = async (data: ForgotEmailValues) => {
    try {
      const result = await dispatch(sendOtpThunk(data)).unwrap();
      showToast.success(result?.message || "OTP sent successfully");
      router.push("/forgotPassword/otp?email=" + data.email);
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5" noValidate>
      <p className="text-center text-body-md text-warm-gray">
        Enter your email address and we&apos;ll send you a verification code.
      </p>

      <InputField
        id="email"
        variant="glass"
        required
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <button
        type="submit"
        disabled={sendOtpLoading}
        className="btn-vivid group flex w-full items-center justify-center gap-sm rounded-full py-4 text-headline-md text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sendOtpLoading ? "Sending..." : "Send Code"}
        {!sendOtpLoading && (
          <FiArrowRight
            size={22}
            className="transition-transform duration-500 group-hover:translate-x-2"
          />
        )}
      </button>
    </form>
  );
}
