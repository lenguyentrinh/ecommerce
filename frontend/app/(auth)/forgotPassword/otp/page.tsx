import { Suspense } from "react";
import Link from "next/link";
import AuthShell from "../../AuthShell";
import OtpForm from "./otpForm";

export default function OtpPage() {
  return (
    <AuthShell
      title="Enter verification code"
      footer={
        <>
          Entered the wrong email?{" "}
          <Link
            href="/forgotPassword"
            className="border-b border-transparent font-semibold text-clay transition-all hover:border-clay hover:text-brown"
          >
            Start over
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="text-center text-body-md text-warm-gray">Loading...</div>
        }
      >
        <OtpForm />
      </Suspense>
    </AuthShell>
  );
}
