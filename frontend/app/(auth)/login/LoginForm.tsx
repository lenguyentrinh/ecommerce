"use client";

import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import { AppDispatch, RootState } from "@/store/store";
import { loginThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";

type FormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const returnParam = useSearchParams().get("return");
  // Only allow same-origin, single-slash paths. Reject protocol-relative
  // (`//evil.com`), backslash (`/\evil.com`) and self-redirects to `/login`.
  const isSafeReturn =
    !!returnParam &&
    returnParam.startsWith("/") &&
    !returnParam.startsWith("//") &&
    !returnParam.startsWith("/\\") &&
    returnParam !== "/login" &&
    !returnParam.startsWith("/login?");
  const safeReturn = isSafeReturn ? returnParam : "/";
  const { loginLoading } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = useForm<FormData>({ mode: "onTouched" });

  const onSubmit = async (data: FormData) => {
    try {
      await dispatch(loginThunk(data)).unwrap();
      showToast.success("Welcome back!");
      router.push(safeReturn);
    } catch (err) {
      // err is the rejectWithValue string from the thunk
      resetField("password");
      let message: string;
      if (err === "Email not verified") {
        message = "Please verify your email first.";
      } else if (err === "Invalid credentials") {
        message = "Invalid email or password.";
      } else {
        // network failure, timeout, 5xx, or any unexpected rejection
        message = "Something went wrong. Please try again.";
      }
      setError("password", { message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-sm" noValidate>
      <InputField
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email format",
          },
        })}
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
      />
      <InputField
        {...register("password", { required: "Password is required" })}
        label="Password"
        type="password"
        placeholder="Your password"
        error={errors.password?.message}
      />
      <div className="text-right">
        <Link
          href="/forgotPassword"
          className="text-body-md text-warm-gray hover:text-brown underline transition-colors duration-300"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" disabled={loginLoading} className="w-full mt-xs">
        {loginLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
