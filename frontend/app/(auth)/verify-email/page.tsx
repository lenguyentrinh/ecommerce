import VerifyEmailForm from "./VerifyEmailForm";
import {Suspense} from "react";

export default function VerifyEmailPage() {
  return (
    <div className="bg-login flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-5 sm:p-8 rounded shadow-md w-full max-w-md">
        <h1 className="font-semibold text-center mb-3">Verify your email</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}