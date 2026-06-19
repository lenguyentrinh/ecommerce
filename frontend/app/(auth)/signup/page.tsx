import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="bg-login flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-5 sm:p-8 rounded shadow-md w-full max-w-2xl">
        <h1 className="font-semibold text-3xl sm:text-4xl text-center mb-3">Wellcome</h1>
        <SignupForm/>
        <div className="flex text-center justify-center text-gray-500 hover:text-gray-700 pt-4">Have your an account? 
            <a href="/login" className="underline">Login</a>
        </div>
      </div>
    </div>
  );
}
