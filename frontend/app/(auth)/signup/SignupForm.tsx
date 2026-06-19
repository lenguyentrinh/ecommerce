"use client";

import { useForm } from "react-hook-form";
import TextInput from "@/components/inputs/TextInput";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { signupThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";

type FormData = {
  userName: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function SignupForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { signupLoading } = useSelector((state: RootState) => state.auth);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({mode: "onTouched"});  

  const passwordValue = watch("password");
  
  const onSubmit = async (data: FormData) => {
    const {confirmPassword, ...payload} = data;
    try{
      const result = await dispatch(signupThunk(payload)).unwrap()
      showToast.success("Signup successful! Please login.");
      router.push(`/verify-email?email=${encodeURIComponent(result?.email || "")}`);
    } catch (err) {
      showToast.error(err as string);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          placeholder="userName..."
          type="text"
          name="userName"
          register={register}
          required="Please enter your username"
          error={errors.userName?.message}
          validate={(value) => {
            if (value.length < 6) {
              return "Username must be at least 6 characters";
            }
            if (!/^[a-zA-Z0-9]+$/.test(value)) {
              return "Username must not contain special characters";
            }
            return true;
          }}
        />
        <TextInput
          placeholder="Birth Date..."
          type="date"
          name="birthDate"
          register={register}
          required="Please choose your birth date"
          error={errors.birthDate?.message}
        />
      </div>
      <TextInput
        placeholder="PhoneNumber..."
        type="tel"
        name="phoneNumber"
        register={register}
        error={errors.phoneNumber?.message}
        required="Please enter your phone number"
        validate={(value) => {
          const cleaned = value.replace(/[\s\-\(\)\+]/g, '');
          if (!/^\d+$/.test(cleaned)) {
            return "Phone number must contain only digits";
          }
          if (cleaned.length < 10) {
            return "Phone number must be at least 10 digits";
          }
          if (cleaned.length > 15) {
            return "Phone number must not exceed 15 digits";
          }
          return true;
        }}
      />
      <TextInput
        placeholder="Email..."
        type="email"
        name="email"
        register={register}
        required="Please enter your email"
        error={errors.email?.message}
        validate={(value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return "Invalid email format";
          }
          return true;
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          placeholder="Password..."
          type="password"
          name="password"
          register={register}
          required="Please enter your password"
          error={errors.password?.message}
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
          placeholder="Confirm Password..."
          type="password"
          name="confirmPassword"
          register={register}
          required="Please confirm your password"
          error={errors.confirmPassword?.message}
          validate={(value) => value === passwordValue || "Passwords not match"}
        />
      </div>

      <button
        type="submit"
        disabled={signupLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded mt-4"
      >
        {signupLoading ? "Loading..." : "Sign Up"}
      </button>
    </form>
  );
}
