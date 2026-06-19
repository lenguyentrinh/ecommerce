"use client";

import TextInput from "@/components/inputs/TextInput";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { sendOtpThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
type FormData = {
  email: string;
};

export default function ForgotPasswordByEmailForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
    const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>();
  const {sendOtpLoading} = useSelector((state: RootState) => state.auth);
  const onSubmit = async (data: FormData) => {
      try {
        const result = await dispatch(sendOtpThunk(data)).unwrap();
        showToast.success(result?.message || "OTP sent successfully");
        router.push("/forgotPassword/otp?email=" + data.email);
      } catch (err) {
        showToast.error(err as string);
      }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        type="email"
        placeholder="Please enter your email"
        register={register}
        error={errors.email?.message}
        required="Email is required"
        name="email"
        validate={(value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return "Invalid email format";
          }
          return true;
        }}
      />
      <button
        type="submit"
        disabled={sendOtpLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
      >
        {sendOtpLoading ? "Loading..." : "Send"}
      </button>
    </form>
  );
}
