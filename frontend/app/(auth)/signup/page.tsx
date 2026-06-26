import Link from 'next/link';
import SignupForm from './SignupForm';

export default function SignupPage() {
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
      <section className="form-glass relative w-full max-w-[580px] overflow-hidden rounded-[40px] p-md transition-all duration-500 md:p-lg">
        <SignupForm />
      </section>

      {/* Redirect to login */}
      <p className="mt-md text-body-md text-warm-gray">
        Already have an account?{' '}
        <Link
          href="/login"
          className="border-b border-transparent font-semibold text-clay transition-all hover:border-clay hover:text-brown"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
