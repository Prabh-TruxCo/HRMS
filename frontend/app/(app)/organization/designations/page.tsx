
"use client";

import DesignationManagement from "@/features/company/components/DesignationManagement";
import ModuleNotEnabled from "@/features/company/components/ModuleNotEnabled";
import { useCompany } from "@/features/company/context/CompanyContext";
import { useOrganizationModuleAccess } from "@/features/company/services/useOrganizationModuleAccess";

export default function DesignationsPage() {
  const { currentCompany } = useCompany();
  const { status } = useOrganizationModuleAccess("designations");

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">
          Checking organization configuration...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Configuration Unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We couldn&apos;t verify whether Designations is enabled for this
            organization. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (status === "disabled") {
    return <ModuleNotEnabled moduleName="Designations" />;
  }

  return (
    <DesignationManagement
      key={currentCompany?.id ?? "no-company"}
      companyId={currentCompany?.id ?? null}
    />
  );
}
