"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

import {
  getMyCompanies,
  type CompanyResponse,
} from "@/features/onboarding/services/companyService";

import { getCompanyRoles } from "@/features/company/services/membershipService";

type CompanyContextValue = {
  companies: CompanyResponse[];
  currentCompany: CompanyResponse | null;
  currentCompanyRoles: string[];
  isLoading: boolean;
  isRolesLoading: boolean;
  setCurrentCompany: (company: CompanyResponse) => void;
  refreshCompanies: () => Promise<void>;
  clearCompanyState: () => void;
};

const CompanyContext = createContext<CompanyContextValue | undefined>(
  undefined,
);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);

  const [currentCompany, setCurrentCompanyState] =
    useState<CompanyResponse | null>(null);

  const [currentCompanyRoles, setCurrentCompanyRoles] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const clearCompanyState = () => {
    setCompanies([]);
    setCurrentCompanyState(null);
    setCurrentCompanyRoles([]);
  };
  const { currentUser } = useAuth();
  const refreshCompanies = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getMyCompanies();

      setCompanies(result);

      setCurrentCompanyState((current) => {
        if (!current) {
          return result[0] ?? null;
        }

        const stillExists = result.find((company) => company.id === current.id);

        return stillExists ?? result[0] ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    refreshCompanies();
  }, [currentUser, refreshCompanies]);

  // Load roles whenever the selected company changes.
  useEffect(() => {
    if (!currentCompany) {
      return;
    }

    let isMounted = true;

    const loadRoles = async () => {
      try {
        setIsRolesLoading(true);

        const result = await getCompanyRoles(currentCompany.id);

        if (!isMounted) return;

        setCurrentCompanyRoles(result.role_names);
      } catch {
        if (!isMounted) return;

        setCurrentCompanyRoles([]);
      } finally {
        if (isMounted) {
          setIsRolesLoading(false);
        }
      }
    };

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, [currentCompany]);
  const setCurrentCompany = (company: CompanyResponse) => {
    setCurrentCompanyState(company);
  };

  const value = useMemo(
    () => ({
      companies,
      currentCompany,
      currentCompanyRoles,
      isLoading,
      isRolesLoading,
      setCurrentCompany,
      refreshCompanies,
      clearCompanyState,
    }),
    [
      companies,
      currentCompany,
      currentCompanyRoles,
      isLoading,
      isRolesLoading,
      refreshCompanies,
    ],
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }

  return context;
}
