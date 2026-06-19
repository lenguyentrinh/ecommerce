import ResetPasswordForm from "./ResetPasswordForm";

export default function reset() {
  return (
    <div className="bg-login flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-5 sm:p-8 rounded shadow-md w-full max-w-md">
              <h1 className="font-semibold  text-center mb-3">Reset your password</h1>
              <ResetPasswordForm/>
            </div>
    </div>
  );
}