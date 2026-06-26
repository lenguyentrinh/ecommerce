import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "About Me", href: "/about-me" },
];

export default function Footer() {
  return (
    <footer className="mt-xl border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-md px-4 py-lg md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-xs">
          <Link
            href="/"
            className="text-headline-md text-brown tracking-[0.04em]"
          >
            Oren
          </Link>
          <p className="text-body-md text-warm-gray">
            Premium women&apos;s fashion.
          </p>
        </div>

        <nav className="flex flex-col gap-xs md:items-end">
          {footerLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-body-md text-warm-gray transition-colors duration-300 hover:text-brown"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-xs px-4 py-sm text-label-sm text-warm-gray md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Oren. All rights reserved.</p>
          <p>Contact: support@oren.store</p>
        </div>
      </div>
    </footer>
  );
}
