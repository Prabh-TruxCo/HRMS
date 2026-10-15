"use client";

import EmployeeManagement from "@/features/company/components/EmployeeManagement";
import { useCompany } from "@/features/company/context/CompanyContext";


export default function EmployeesPage() {
  const { currentCompany } = useCompany();

  return <EmployeeManagement companyId={currentCompany?.id ?? null} />;
}
