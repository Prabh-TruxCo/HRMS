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
import { CompanyTheme } from "@/features/company/theme/CompanyTheme";
import {
  getMyCompanies,
  type CompanyResponse,
} from "@/features/onboarding/services/companyService";

import { getCompanyRoles } from "@/features/company/services/membershipService";

export const DEFAULT_BRAND_COLOR = "#5F8F59";
const SELECTED_COMPANY_STORAGE_KEY = "hrms_selected_company_id";

export function getCompanyBrandColor(color: string | null | undefined): string {
  return color?.trim() || DEFAULT_BRAND_COLOR;
}

type CompanyContextValue = {
  companies: CompanyResponse[];
  currentCompany: CompanyResponse | null;
  currentCompanyRoles: string[];
  brandColor: string;
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
  const clearCompanyState = useCallback(() => {
    setCompanies([]);
    setCurrentCompanyState(null);
    setCurrentCompanyRoles([]);

    localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
  }, []);
  const { currentUser } = useAuth();
  const refreshCompanies = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getMyCompanies();

      setCompanies(result);

      setCurrentCompanyState((current) => {
        const savedCompanyId =
          typeof window !== "undefined"
            ? localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY)
            : null;

        const preferredCompanyId = savedCompanyId
          ? Number(savedCompanyId)
          : current?.id;

        const preferredCompany = result.find(
          (company) => company.id === preferredCompanyId,
        );

        const nextCompany = preferredCompany ?? result[0] ?? null;

        if (nextCompany) {
          localStorage.setItem(
            SELECTED_COMPANY_STORAGE_KEY,
            String(nextCompany.id),
          );
        } else {
          localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
        }

        return nextCompany;
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
  const setCurrentCompany = useCallback((company: CompanyResponse) => {
    localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, String(company.id));

    setCurrentCompanyState(company);
  }, []);

  const value = useMemo(
    () => ({
      companies,
      currentCompany,
      currentCompanyRoles,
      brandColor: getCompanyBrandColor(currentCompany?.color),
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
      setCurrentCompany,
      refreshCompanies,
      clearCompanyState,
    ],
  );

  return (
    <CompanyContext.Provider value={value}>
      <CompanyTheme brandColor={value.brandColor}>{children}</CompanyTheme>
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }

  return context;
}
