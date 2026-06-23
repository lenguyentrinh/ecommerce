import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  inputId?: string;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField({ label, error, inputId, className = '', ...rest }, ref) {
    const id = inputId ?? rest.id;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-label-sm text-brown">{label}</label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-[16px] bg-warm-beige px-4 py-2.5 text-body-md text-brown placeholder:text-warm-gray outline-none border border-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-clay focus-visible:outline-none ${className}`}
          {...rest}
        />
        {error && (
          <span role="alert" className="text-label-sm text-error">{error}</span>
        )}
      </div>
    );
  },
);

export default InputField;
