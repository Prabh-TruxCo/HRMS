"use client";

import type { ReactNode } from "react";

import DashboardSidebar from "@/features/dashboard/components/DashboardSidebar";
import DashboardTopbar from "@/features/dashboard/components/DashboardTopbar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F4F0]">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar />

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}