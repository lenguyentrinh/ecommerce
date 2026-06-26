import Link from "next/link";
import AuthShell from "../AuthShell";
import ForgotPasswordByEmailForm from "./ForgotPasswordByEmailForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      footer={
        <>
          Remember your password?{" "}
          <Link
            href="/login"
            className="border-b border-transparent font-semibold text-clay transition-all hover:border-clay hover:text-brown"
          >
            Sign In
          </Link>
        </>
      }
    >
      <ForgotPasswordByEmailForm />
    </AuthShell>
  );
}
