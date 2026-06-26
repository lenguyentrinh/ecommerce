import React from 'react';

type Variant = 'default' | 'glass';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  inputId?: string;
  /** Visual treatment. `default` = standard warm-beige field; `glass` = frosted Stitch auth field. */
  variant?: Variant;
  /** Adornment rendered inside the input box (e.g. a password show/hide toggle). */
  trailing?: React.ReactNode;
  labelClassName?: string;
}

// Per-variant class sets. `default` reproduces the original component exactly so
// login / verify-email are untouched; `glass` matches the "Join Oren" signup screen.
const STYLES: Record<Variant, { wrapper: string; label: string; input: string; error: string }> = {
  default: {
    wrapper: 'flex flex-col gap-1',
    label: 'text-label-sm text-brown',
    input:
      'w-full rounded-[16px] bg-warm-beige px-4 py-2.5 text-body-md text-brown placeholder:text-warm-gray outline-none border border-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-clay focus-visible:outline-none',
    error: 'text-label-sm text-error-strong',
  },
  glass: {
    wrapper: '',
    label: 'ml-2 mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-warm-gray/70',
    input:
      'input-glass w-full rounded-2xl border border-transparent px-5 py-4 text-body-md text-brown placeholder:text-warm-gray/40 outline-none',
    error: 'ml-2 mt-1 block text-[12px] text-error-strong',
  },
};

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    { label, error, inputId, variant = 'default', trailing, className = '', labelClassName = '', required, ...rest },
    ref,
  ) {
    const id = inputId ?? rest.id;
    const styles = STYLES[variant];

    const input = (
      <input
        ref={ref}
        id={id}
        required={required}
        aria-required={required}
        className={`${styles.input} ${trailing ? 'pr-12' : ''} ${className}`}
        {...rest}
      />
    );

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={id} className={`${styles.label} ${labelClassName}`}>
            {label}
            {required && <span className="text-error-strong"> *</span>}
          </label>
        )}
        {trailing ? (
          <div className="relative">
            {input}
            {trailing}
          </div>
        ) : (
          input
        )}
        {error && (
          <span role="alert" className={styles.error}>
            {error}
          </span>
        )}
      </div>
    );
  },
);

export default InputField;
