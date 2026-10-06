"use client";

import ClientManagement from "@/features/company/components/ClientManagement";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function ClientsPage() {
  const { currentCompany } = useCompany();

  return (
    <ClientManagement
      key={currentCompany?.id ?? "no-company"}
      companyId={currentCompany?.id ?? null}
    />
  );
}