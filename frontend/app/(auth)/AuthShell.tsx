import React from "react";

// Shared layout for every pre-auth screen (login, signup, verify-email,
// forgot-password steps). Renders the full-bleed editorial background, the
// "Oren" serif wordmark anchor, and a frosted glass card — so all auth pages
// read as one consistent flow. Pages supply the card title, body, and an
// optional footer (e.g. a "switch to login" link).
export default function AuthShell({
  title,
  cardClassName = "max-w-[480px]",
  children,
  footer,
}: {
  title?: string;
  cardClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
      <section
        className={`form-glass relative w-full ${cardClassName} overflow-hidden rounded-[40px] p-md transition-all duration-500 md:p-lg`}
      >
        {title && (
          <h2 className="mb-md text-center text-headline-md tracking-[0.03em] text-brown">
            {title}
          </h2>
        )}
        {children}
      </section>

      {/* Optional redirect / helper line */}
      {footer && <p className="mt-md text-body-md text-warm-gray">{footer}</p>}
    </div>
  );
}
