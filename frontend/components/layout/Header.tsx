"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiShoppingBag, FiUser } from "react-icons/fi";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { logoutThunk } from "@/store/authThunk";
import { selectCartCount } from "@/store/cartSlice";
import SearchBar from "@/components/ui/SearchBar";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  { label: "About", href: "/about-me" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const accountDisplayName = user?.userName || user?.email || "Account";

  const handleLogout = async () => {
    setIsOpen(false);
    await dispatch(logoutThunk());
    router.replace("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscClose = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscClose);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscClose);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) setIsOpen(false);
  }, [isAuthenticated]);

  const iconBtn =
    "text-brown transition-colors duration-300 hover:text-clay";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/40 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-md py-md md:px-lg">
        {/* Brand + nav */}
        <div className="flex items-center gap-lg">
          <Link
            href="/"
            className="text-2xl font-bold uppercase tracking-tight text-brown transition-transform duration-300 hover:scale-[1.02] md:text-3xl"
          >
            Oren
          </Link>
          <nav className="hidden items-center gap-md md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-body-md uppercase tracking-widest text-warm-gray transition-colors duration-300 hover:text-brown"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Utility: search + icons */}
        <div className="flex items-center gap-sm md:gap-md">
          <SearchBar className="w-32 sm:w-44 md:w-56" />
          <Link
            href="/cart"
            aria-label={
              cartCount > 0 ? `Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Cart"
            }
            className={`relative ${iconBtn}`}
          >
            <FiShoppingBag size={20} />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-2 -top-2 flex min-w-[18px] items-center justify-center rounded-full bg-brown px-1 text-[10px] font-semibold leading-none text-ivory"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="Account menu"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`${iconBtn} ${isOpen ? "text-clay" : ""}`}
              >
                <FiUser size={20} />
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+12px)] z-50 min-w-48 overflow-hidden rounded-xl border border-hairline/50 bg-white shadow-ambient ${
                  isOpen ? "block" : "hidden"
                }`}
              >
                <p className="truncate border-b border-hairline/40 px-4 py-3 text-label-sm uppercase tracking-widest text-warm-gray">
                  {accountDisplayName}
                </p>
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-body-md text-brown transition-colors hover:bg-sand/40"
                >
                  My Account
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-3 text-left text-body-md text-brown transition-colors hover:bg-sand/40"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" aria-label="Sign in" className={iconBtn}>
              <FiUser size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
