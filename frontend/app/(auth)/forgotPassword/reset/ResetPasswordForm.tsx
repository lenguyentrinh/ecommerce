"use client";

import { useForm } from "react-hook-form";
import TextInput from "@/components/inputs/TextInput";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { resetPasswordThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

type formData = {
  newPassword: string;
  confirmNewPassword: string;
  email: string;
};

export default function ResetPasswordForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {resetPasswordLoading} = useSelector((state: RootState) => state.auth);
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm<formData>();

  const onSubmit = async (data: formData) => {
    const email = searchParams.get("email");
    data = {...data, email: email || ""};

     try {
      const result = await dispatch(resetPasswordThunk(data)).unwrap();
      showToast.success(result?.message || "Password reset successfully");
      router.push("/login");
    } catch (err) {
      showToast.error(err as string);
    }
  };
  const newPasswordValue = watch("newPassword");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        type="password"
        placeholder="Please enter your password"
        placeholder="Please enter your password"
        register={register}
        error={errors.newPassword?.message}
        required="Password is required"
        name="newPassword"
        validate={(value) => {
          if (value.length < 6) {
            return "Password must be at least 6 charater";
          }
          if (!/[A-Z]/.test(value)) {
            return "Password must contain at least 1 uppercase letter";
          }
          return true;
        }}
      />
      <TextInput
        type="password"
        placeholder="Please enter your confirmNewPassword"
        register={register}
        error={errors.confirmNewPassword?.message}
        required="ConfirmNewPassword is required"
        name="confirmNewPassword"
        validate={(value) => value === newPasswordValue || "Passwords not match"}
      />
      <button
        type="submit"
        disabled={resetPasswordLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
      >
        {resetPasswordLoading ? "Loading..." : "Reset"}
      </button>
    </form>
  );
}
