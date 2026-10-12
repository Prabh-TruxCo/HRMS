
"use client";

import PostManagement from "@/features/company/components/PostManagement";
import { useCompany } from "@/features/company/context/CompanyContext";

export default function PostsPage() {
  const { currentCompany } = useCompany();

  return (
    <PostManagement
      key={currentCompany?.id ?? "no-company"}
      companyId={currentCompany?.id ?? null}
    />
  );
}
