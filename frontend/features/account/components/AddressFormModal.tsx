'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import AddressForm from './AddressForm';

interface AddressFormModalProps {
  addressId?: number | null;
  onClose: () => void;
  onSaved: () => void;
}

// Popup wrapper around AddressForm. Keeps the shopper on the account page while
// adding/editing. Esc + backdrop close, body scroll locked while open.
export default function AddressFormModal({
  addressId = null,
  onClose,
  onSaved,
}: AddressFormModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Lock the REAL scroll container (usually <html>, not <body>) so the page
    // scrollbar doesn't linger behind the modal. Compensate its width so the
    // page doesn't shift when the scrollbar is removed.
    const scroller = (document.scrollingElement as HTMLElement) || document.documentElement;
    const scrollbarWidth = window.innerWidth - scroller.clientWidth;
    const prevOverflow = scroller.style.overflow;
    const prevPaddingRight = scroller.style.paddingRight;
    scroller.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const basePadding = parseFloat(getComputedStyle(scroller).paddingRight) || 0;
      scroller.style.paddingRight = `${basePadding + scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      scroller.style.overflow = prevOverflow;
      scroller.style.paddingRight = prevPaddingRight;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
      <div
        className="absolute inset-0 bg-brown/40 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-form-title"
        className="account-rise soft-shadow relative z-10 flex max-h-[90dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-warm-white"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-md top-md z-10 text-warm-gray/60 transition-colors hover:text-brown"
        >
          <FiX size={20} />
        </button>
        {/* Scroll lives here, not on the bordered box: the modal sizes to its
            content and only this region scrolls when content truly exceeds the
            capped height. min-h-0 lets it shrink inside the flex column. */}
        <div className="min-h-0 overflow-y-auto p-md md:p-lg">
          <AddressForm
            addressId={addressId}
            onSuccess={onSaved}
            onCancel={onClose}
            titleId="address-form-title"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
