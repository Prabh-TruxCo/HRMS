"use client";

import { useEffect, useState } from "react";
import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getOrganizationConfiguration,
  type OrganizationConfiguration,
} from "@/features/company/services/organizationService";

type OrganizationModule =
  | "branches"
  | "departments"
  | "teams"
  | "designations"
  | "clients"
  | "sites"
  | "posts";

type AccessStatus = "loading" | "enabled" | "disabled" | "error";

type AccessState = {
  companyId: number;
  configuration: OrganizationConfiguration;
};

function isModuleEnabled(
  configuration: OrganizationConfiguration,
  module: OrganizationModule,
): boolean {
  switch (module) {
    case "branches":
      return configuration.branches_enabled;
    case "departments":
      return configuration.departments_enabled;
    case "teams":
      return configuration.teams_enabled;
    case "designations":
      return configuration.designations_enabled;
    case "clients":
      return configuration.clients_enabled;
    case "sites":
      return configuration.sites_enabled;
    case "posts":
      return configuration.posts_enabled;
  }
}

export function useOrganizationModuleAccess(module: OrganizationModule) {
  const { currentCompany, isLoading: isCompanyLoading } = useCompany();
  const companyId = currentCompany?.id ?? null;

  const [state, setState] = useState<AccessState | null>(null);
  const [requestFailed, setRequestFailed] = useState<number | null>(null);

  useEffect(() => {
    if (isCompanyLoading || companyId === null) return;

    let cancelled = false;
const activeCompanyId = companyId;
    async function loadConfiguration() {
      try {
        const configuration = await getOrganizationConfiguration(activeCompanyId);

        if (!cancelled) {
          setState({ companyId: activeCompanyId, configuration });
          setRequestFailed(null);
        }
      } catch {
        if (!cancelled) {
          setRequestFailed(companyId);
        }
      }
    }

    void loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [companyId, isCompanyLoading]);

  let status: AccessStatus = "loading";

  if (!isCompanyLoading && companyId !== null) {
    if (requestFailed === companyId) {
      status = "error";
    } else if (state?.companyId === companyId) {
      status = isModuleEnabled(state.configuration, module)
        ? "enabled"
        : "disabled";
    }
  }

  return { status };
}
