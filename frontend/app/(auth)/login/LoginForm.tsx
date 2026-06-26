"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import InputField from "@/components/InputField";
import { AppDispatch, RootState } from "@/store/store";
import { loginThunk } from "@/store/authThunk";
import { showToast } from "@/lib/toast";
import { loginSchema, type LoginValues } from "@/lib/validation/authSchemas";

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

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = useForm<LoginValues>({ mode: "onTouched", resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginValues) => {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5" noValidate>
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

      <InputField
        id="password"
        variant="glass"
        required
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Your password"
        error={errors.password?.message}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray/50 transition-colors hover:text-brown"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        }
        {...register("password")}
      />

      <div className="text-right">
        <Link
          href="/forgotPassword"
          className="text-body-md text-warm-gray underline transition-colors duration-300 hover:text-brown"
        >
          Forgot password?
        </Link>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loginLoading}
          className="btn-vivid group flex w-full items-center justify-center gap-sm rounded-full py-4 text-headline-md text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginLoading ? "Signing in..." : "Sign In"}
          {!loginLoading && (
            <FiArrowRight
              size={22}
              className="transition-transform duration-500 group-hover:translate-x-2"
            />
          )}
        </button>
      </div>
    </form>
  );
}
