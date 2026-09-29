"use client";

import type { ReactNode } from "react";

import DashboardSidebar from "@/features/dashboard/components/DashboardSidebar";
import DashboardTopbar from "@/features/dashboard/components/DashboardTopbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main application */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <div className="shrink-0">
          <DashboardTopbar />
        </div>

        {/* Page area */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
