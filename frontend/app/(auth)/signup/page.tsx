import SignupForm from './SignupForm';

export default function SignupPage() {
  return (
    <div className="flex flex-1 bg-ivory items-center justify-center p-sm">
      <div className="w-full max-w-[28rem] bg-surface rounded-xl shadow-ambient p-md">
        <h1 className="text-headline-md text-brown text-center mb-md tracking-[0.03em]">
          Create Account
        </h1>
        <SignupForm />
        <p className="text-center text-body-md text-warm-gray mt-sm">
          Already have an account?{' '}
          <a href="/login" className="text-brown underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
