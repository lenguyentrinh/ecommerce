"use client";

import TextInput from "@/components/inputs/TextInput";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { verifyOtpThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
type formData = {
  otp: string;
  email: string;
};

export default function OtpForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const {verifyOtpLoading} = useSelector((state: RootState) => state.auth);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<formData>();
  const onSubmit = async (data: formData) => {
    const email = searchParams.get("email");
    data = {...data, email: email || ""};
    try {
      const result = await dispatch(verifyOtpThunk(data)).unwrap();
      showToast.success(result?.message || "OTP verified successfully");
      router.push("/forgotPassword/reset?email=" + email);
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        type="text"
        register={register}
        name="otp"
        placeholder="Please enter otp"
        required="Please enter otp"
        error={errors.otp?.message}
      />
      <button
        type="submit"
        disabled={verifyOtpLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
      >
        {verifyOtpLoading ? "Loading..." : "Verify"}
      </button>
    </form>
  );
}
