import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-sm">
      <div className="w-full max-w-md bg-surface rounded-xl shadow-ambient p-md">
        <h1 className="text-headline-md text-brown text-center mb-md tracking-[0.03em]">
          Welcome back
        </h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-body-md text-warm-gray mt-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brown underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
