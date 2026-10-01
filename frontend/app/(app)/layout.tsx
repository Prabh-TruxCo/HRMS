import type { ReactNode } from "react";

import AuthGuard from "@/features/auth/components/AuthGuard";
import DashboardLayout from "@/features/dashboard/components/DashboardLayout";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}