import React from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-2.5 text-label-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2';

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-brown text-ivory border-transparent hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    secondary:
      'bg-transparent text-brown border border-sand hover:bg-blush hover:border-clay disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-sand',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
