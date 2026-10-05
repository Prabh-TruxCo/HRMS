"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Snackbar, {
  type SnackbarData,
  type SnackbarType,
} from "./Snackbar";

type SnackbarContextValue = {
  showSnackbar: (
    message: string,
    type?: SnackbarType,
  ) => void;

  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;

  closeSnackbar: (id: number) => void;
};

const SnackbarContext =
  createContext<SnackbarContextValue | null>(null);

type SnackbarProviderProps = {
  children: ReactNode;
};

export function SnackbarProvider({
  children,
}: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<
    SnackbarData[]
  >([]);

  const closeSnackbar = useCallback((id: number) => {
    setSnackbars((current) =>
      current.filter((snackbar) => snackbar.id !== id),
    );
  }, []);

  const showSnackbar = useCallback(
    (
      message: string,
      type: SnackbarType = "info",
    ) => {
      const id = Date.now() + Math.random();

      setSnackbars((current) => [
        ...current.slice(-2),
        {
          id,
          type,
          message,
        },
      ]);
    },
    [],
  );

  const showSuccess = useCallback(
    (message: string) => {
      showSnackbar(message, "success");
    },
    [showSnackbar],
  );

  const showError = useCallback(
    (message: string) => {
      showSnackbar(message, "error");
    },
    [showSnackbar],
  );

  const showWarning = useCallback(
    (message: string) => {
      showSnackbar(message, "warning");
    },
    [showSnackbar],
  );

  const showInfo = useCallback(
    (message: string) => {
      showSnackbar(message, "info");
    },
    [showSnackbar],
  );

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSnackbar,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      closeSnackbar,
    }),
    [
      showSnackbar,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      closeSnackbar,
    ],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}

      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {snackbars.map((snackbar) => (
          <div
            key={snackbar.id}
            className="pointer-events-auto w-full sm:w-auto"
          >
            <Snackbar
              snackbar={snackbar}
              onClose={closeSnackbar}
            />
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error(
      "useSnackbar must be used inside SnackbarProvider.",
    );
  }

  return context;
}