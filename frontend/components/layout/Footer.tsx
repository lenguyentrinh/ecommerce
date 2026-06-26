import Link from "next/link";

const columns = [
  {
    heading: "Shop",
    links: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/product" },
      { label: "About", href: "/about-me" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact", href: "mailto:support@oren.store" },
      { label: "Shipping", href: "#" },
      { label: "Returns", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
  {
    heading: "Follow",
    links: [
      { label: "Instagram", href: "#" },
      { label: "Pinterest", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-brown text-ivory">
      <div className="mx-auto max-w-[1280px] px-md py-xl md:px-lg">
        <div className="flex flex-col gap-xl md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex max-w-[320px] flex-col gap-md">
            <Link href="/" className="text-display-lg tracking-tight text-ivory">
              Oren
            </Link>
            <p className="text-body-md leading-relaxed text-ivory/60">
              A destination for curated aesthetics and timeless editorial vision. Elevating the
              everyday through intentional design.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-lg md:grid-cols-4 md:gap-xl">
            {columns.map((col) => (
              <nav key={col.heading} className="flex flex-col gap-sm">
                <span className="text-label-sm uppercase tracking-widest text-ivory/40">
                  {col.heading}
                </span>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-body-md text-ivory/80 transition-colors duration-300 hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-xl border-t border-ivory/10 pt-lg">
          <p className="text-label-sm uppercase tracking-[0.18em] text-ivory/50">
            © {new Date().getFullYear()} Oren. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
