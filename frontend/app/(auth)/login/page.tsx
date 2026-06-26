import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="bg-signup flex flex-1 flex-col items-center justify-center px-md py-md ">
      {/* Brand anchor */}
      <header className="mb-md text-center">
        <h1 className="font-display-serif text-[40px] italic leading-none text-brown select-none md:text-[64px]">
          Oren
        </h1>
        <p className="mt-2 text-[12px] italic uppercase tracking-[0.25em] text-warm-gray opacity-80">
          An invitation to the art of dressing
        </p>
      </header>

      {/* Glass form canvas */}
      <section className="form-glass relative w-full max-w-[480px] overflow-hidden rounded-[40px] p-md transition-all duration-500 md:p-lg">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>

      {/* Redirect to signup */}
      <p className="mt-md text-body-md text-warm-gray">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="border-b border-transparent font-semibold text-clay transition-all hover:border-clay hover:text-brown"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
