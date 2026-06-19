"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { logoutThunk } from "@/store/authThunk";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "About Me", href: "/about-me" },
];

const accountOptions = [
  { label: "My Account", href: "/my-account" },
  { label: "Logout", href: "/logout" }
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const accountDisplayName = user?.userName || user?.email || "Account";

  const handleLogout = async () => {
    setIsOpen(false);
    await dispatch(logoutThunk());
    router.replace("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscClose);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscClose);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-40 bg-white backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-slate-900">
          Ecommerce
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-base font-semibold text-slate-700 transition-colors hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {isAuthenticated ? (
          <div ref={dropdownRef} className="relative hidden md:block">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
            >
              <span>{accountDisplayName}</span>
              <span className={`text-xs text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

            <div
              className={`absolute right-0 top-12 z-50 min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${
                isOpen ? "block" : "hidden"
              }`}
            >
              {accountOptions.map((option) => (
                option.label === "Logout" ? (
                  <button
                    key={option.label}
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  >
                    {option.label}
                  </button>
                ) : (
                  <Link
                    key={option.label}
                    href={option.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600"
                  >
                    {option.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-blue-600 md:block"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
