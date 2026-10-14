"use client";

import { useEffect, useState } from "react";
import OrganizationOverview from "@/features/company/components/OrganizationOverview";
import { useCompany } from "@/features/company/context/CompanyContext";
import {
  getOrganizationConfiguration,
  type OrganizationConfiguration,
} from "@/features/company/services/organizationService";

type ConfigurationState = {
  companyId: number;
  configuration: OrganizationConfiguration | null;
  error: boolean;
};

export default function OrganizationPage() {
  const { currentCompany, isLoading: isCompanyLoading } = useCompany();
  const companyId = currentCompany?.id ?? null;

  const [configurationState, setConfigurationState] =
    useState<ConfigurationState | null>(null);

  useEffect(() => {
    if (isCompanyLoading || companyId === null) return;

    let cancelled = false;
    const activeCompanyId = companyId;

    async function loadConfiguration() {
      try {
        const configuration =
          await getOrganizationConfiguration(activeCompanyId);

        if (!cancelled) {
          setConfigurationState({
            companyId: activeCompanyId,
            configuration,
            error: false,
          });
        }
      } catch {
        if (!cancelled) {
          setConfigurationState({
            companyId: activeCompanyId,
            configuration: null,
            error: true,
          });
        }
      }
    }

    void loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [companyId, isCompanyLoading]);

  const isCurrentCompany = configurationState?.companyId === companyId;

  const organizationConfiguration =
    isCurrentCompany && !configurationState?.error
      ? (configurationState?.configuration ?? null)
      : null;

  if (isCompanyLoading || companyId === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading organization...</p>
      </div>
    );
  }

  if (isCurrentCompany && configurationState?.error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Configuration Unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t load this organization&apos;s configuration. Please
            refresh the page and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!isCurrentCompany) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading organization configuration...
        </p>
      </div>
    );
  }

  return (
    <OrganizationOverview
      companyId={companyId}
      organizationConfiguration={organizationConfiguration}
    />
  );
}
