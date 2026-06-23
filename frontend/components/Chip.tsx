import React from 'react';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Chip({
  label,
  selected = false,
  onClick,
  className = '',
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-label-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 ${
        selected
          ? 'bg-blush border border-clay text-brown'
          : 'bg-warm-beige border border-transparent text-warm-gray hover:border-clay'
      } ${className}`}
    >
      {label}
    </button>
  );
}
