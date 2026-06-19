"use client";

import { useForm } from "react-hook-form";
import TextInput from "@/components/inputs/TextInput";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { loginThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";

type FormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loginLoading } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({mode: "onTouched"});

  const onSubmit = async (data: FormData) => {
    try {
      const result = await dispatch(loginThunk(data)).unwrap();
      showToast.success(result?.message || "Login successful");
      router.push("/");
    } catch (err) {
      // err is the value from rejectWithValue in the thunk (already a string message)
      showToast.error(err as string);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
      <TextInput
        placeholder="Password..."
        type="password"
        name="password"
        register={register}
        required="Please enter your password"
        error={errors.password?.message}
        validate={(value)=>{
          if(value.length < 6){
            return "Password must be at least 6 characters";
          }
          if(!/[A-Z]/.test(value)){
            return "Password must contain at least 1 uppercase letter";
          }
          return true;
        }}
      />
      <div className="text-right mt-1">
        <a href="/forgotPassword" className="text-gray-500 hover:text-gray-700">
          Forgot password?
        </a>
      </div>
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={loginLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
        >
          {loginLoading ? "Loading..." : "Login"}
        </button>
      </div>
    </form>
  );
}
