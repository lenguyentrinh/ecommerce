"use client";

import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import TextInput from "@/components/inputs/TextInput";
import { showToast } from "@/lib/toast";
import { useDispatch, useSelector } from "react-redux";
import { verifyEmailThunk } from "@/store/authThunk";
import { AppDispatch, RootState } from "@/store/store";

interface FormData {
  code: string;
  email: string | null;
}

export default function VerifyEmailForm() {
  const dispatch = useDispatch<AppDispatch>();
  const email = useSearchParams().get("email");
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ mode: "onTouched" });
  const router = useRouter();
  const { verifyEmailLoading } = useSelector((state: RootState) => state.auth);

  const onSubmit = async (data: FormData) => {
    data = { ...data, email: email };
    try {
      await dispatch(verifyEmailThunk(data)).unwrap();
      showToast.info("Verify email is sucessfull! Please enter usename and password to login!");
      router.push("/login");
    } catch (err) {
      showToast.error(err as string);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="">
        <p className="text-center text-sm text-red-500 mb-3">
          Please check your email <span className="font-bold">{email}</span> for the verification code.
        </p>
        <TextInput
          placeholder="Code..."
          type="text"
          name="code"
          register={register}
          required="Please enter the code"
          error={errors.code?.message}
        />
      </div>
      <div className="flex justify-between">
        <button
          type="submit"
          disabled={verifyEmailLoading}
          className="w-50 mr-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded"
        >
          {verifyEmailLoading ? "Loading..." : "Verify"}
        </button>
        <button
          type="button"
          className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => router.push("/login")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
