"use client";

import toast from "react-hot-toast";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      icon: <FaCheckCircle className="text-green-500" size={20} />,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      icon: <FaExclamationCircle className="text-red-500" size={20} />,
    });
  },
  warning: (message: string) => {
    toast(message, {
      icon: <FaExclamationTriangle className="text-yellow-500" size={20} />,
      style: {
        background: '#363636',
        color: '#fff',
      },
    });
  },
  info: (message: string) => {
    toast(message, {
      icon: <FaInfoCircle className="text-blue-500" size={20} />,
      style: {
        background: '#363636',
        color: '#fff',
      },
    });
  },
};
