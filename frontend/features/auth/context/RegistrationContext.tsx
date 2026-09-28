"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RegistrationData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

type RegistrationContextValue = {
 registrationData: RegistrationData;
  setRegistrationData: (data: RegistrationData) => void;
  clearRegistrationData: () => void;
};

const RegistrationContext =
  createContext<RegistrationContextValue | undefined>(undefined);

export function RegistrationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [registrationData, setRegistrationData] =
  useState<RegistrationData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const value = useMemo(
    () => ({
      registrationData,

      setRegistrationData: (data: RegistrationData) => {
        setRegistrationData(data);
      },

     clearRegistrationData: () => {
  setRegistrationData({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
},
    }),
    [registrationData],
  );

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);

  if (!context) {
    throw new Error(
      "useRegistration must be used inside RegistrationProvider",
    );
  }

  return context;
}