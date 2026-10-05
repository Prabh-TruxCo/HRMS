"use client";

import { useEffect } from "react";

export type SnackbarType = "success" | "error" | "warning" | "info";

export type SnackbarData = {
  id: number;
  type: SnackbarType;
  message: string;
};

type SnackbarProps = {
  snackbar: SnackbarData;
  onClose: (id: number) => void;
};

export default function Snackbar({
  snackbar,
  onClose,
}: SnackbarProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose(snackbar.id);
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [snackbar.id, onClose]);

  const styles: Record<
    SnackbarType,
    {
      container: string;
      icon: string;
    }
  > = {
    success: {
      container:
        "border-green-200 bg-green-50 text-green-800",
      icon: "✓",
    },
    error: {
      container:
        "border-red-200 bg-red-50 text-red-800",
      icon: "!",
    },
    warning: {
      container:
        "border-amber-200 bg-amber-50 text-amber-800",
      icon: "!",
    },
    info: {
      container:
        "border-blue-200 bg-blue-50 text-blue-800",
      icon: "i",
    },
  };

  const style = styles[snackbar.type];

  return (
    <div
      role={
        snackbar.type === "error"
          ? "alert"
          : "status"
      }
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${style.container}`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
        aria-hidden="true"
      >
        {style.icon}
      </span>

      <p className="min-w-0 flex-1 pt-0.5 text-sm font-medium">
        {snackbar.message}
      </p>

      <button
        type="button"
        onClick={() => onClose(snackbar.id)}
        aria-label="Close notification"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-lg leading-none opacity-60 transition hover:bg-black/5 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}