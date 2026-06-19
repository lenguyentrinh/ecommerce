"use client";
import { Path, UseFormRegister, FieldValues } from "react-hook-form";

type textInputProps<TFormValues extends FieldValues> = {
  label?: string;
  placeholder?: string;
  type?: string;
  name: Path<TFormValues>;
  register: UseFormRegister<TFormValues>;
  required?: string;
  error?: string;
  validate?: (value:string) => boolean | string;
};
export default function TextInput<TFormValues extends FieldValues>({
  label,
  placeholder,
  type = "text",
  name,
  register,
  required,
  error,
  validate
}: textInputProps<TFormValues>) {
  return (
    <div className="mb-3">
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className="w-full rounded-lg p-2 border border-gray-300 shadow-md focus:outline-none"
        type={type}
        placeholder={placeholder}
        {...register(name, { required , validate})}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
