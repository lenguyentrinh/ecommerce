import Link from "next/link";

export default function LogoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Logout</h1>
      <p className="mt-3 text-slate-600">Hook this page to your logout action in Redux or API.</p>
      <Link href="/login" className="mt-6 inline-block font-semibold text-blue-600 hover:text-blue-700">
        Go to Login
      </Link>
    </main>
  );
}
