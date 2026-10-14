"use client";

import { useEffect, useState } from "react";
import OrganizationOverview from "@/features/company/components/OrganizationOverview";
import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getOrganizationConfiguration,
  type OrganizationConfiguration,
} from "@/features/company/services/organizationService";

export default function OrganizationPage() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id ?? null;

  const [configurationState, setConfigurationState] = useState<{
    companyId: number | null;
    configuration: OrganizationConfiguration | null;
  }>({
    companyId: null,
    configuration: null,
  });

  useEffect(() => {
    if (companyId === null) return;
    const activeCompanyId = companyId;

    let cancelled = false;

    async function loadConfiguration() {
      try {
        const configuration =
          await getOrganizationConfiguration(activeCompanyId);

        if (!cancelled) {
          setConfigurationState({
            companyId,
            configuration,
          });
        }
      } catch {
        if (!cancelled) {
          setConfigurationState({
            companyId,
            configuration: null,
          });
        }
      }
    }

    void loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  // Never use another company's configuration while the new one loads.
  const organizationConfiguration =
    configurationState.companyId === companyId
      ? configurationState.configuration
      : null;

  return (
    <OrganizationOverview
      companyId={companyId}
      organizationConfiguration={organizationConfiguration}
    />
  );
}
