import { Suspense } from "react";
import Link from "next/link";
import AuthShell from "../AuthShell";
import VerifyEmailForm from "./VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      footer={
        <>
          Already verified?{" "}
          <Link
            href="/login"
            className="border-b border-transparent font-semibold text-clay transition-all hover:border-clay hover:text-brown"
          >
            Sign In
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="text-center text-body-md text-warm-gray">Loading...</div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
