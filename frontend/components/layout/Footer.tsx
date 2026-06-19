export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} FE Ecommerce. All rights reserved.</p>
        <p>Contact: support@feecommerce.dev</p>
      </div>
    </footer>
  );
}
