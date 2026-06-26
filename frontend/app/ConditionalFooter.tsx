"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";

// Pre-auth flows (login, signup, verify email, password recovery) are
// single-purpose focus pages — they intentionally render without the site
// footer so nothing competes with the form.
const HIDE_FOOTER_PREFIXES = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgotPassword",
];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hideFooter = HIDE_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hideFooter) return null;
  return <Footer />;
}
