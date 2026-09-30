"use client";

import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { logoutAccount } from "@/features/auth/services/logoutService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCompany } from "@/features/company/context/CompanyContext";

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Employees",
    icon: Users,
  },
  {
    label: "Attendance",
    icon: ClipboardList,
  },
  {
    label: "Leave",
    icon: CalendarDays,
  },
  {
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    label: "Tickets",
    icon: FileText,
  },
  {
    label: "Assets",
    icon: Package,
  },
  {
    label: "Reports",
    icon: BarChart3,
  },
];

export default function DashboardSidebar() {
  const router = useRouter();
  const { setCurrentUser } = useAuth();
  const { clearCompanyState, currentCompany } = useCompany();
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const logoUrl = currentCompany?.logo
    ? currentCompany.logo.startsWith("http")
      ? currentCompany.logo
      : `${API_URL}${currentCompany.logo}`
    : null;
  const handleLogout = async () => {
    try {
      await logoutAccount();
    } finally {
      setCurrentUser(null);
      clearCompanyState();

      router.replace("/login");
    }
  };
  return (
    <aside className="hidden w-[240px] shrink-0 border-r border-[#E1E5DE] bg-[#FCFCFA] lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-[#E8EBE5] px-4 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{
            backgroundColor: logoUrl
              ? "transparent"
              : "var(--brand-color-soft)",
          }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${currentCompany?.name ?? "Company"} logo`}
              width={40}
              height={40}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--brand-color)" }}
            >
              {currentCompany?.name?.slice(0, 2).toUpperCase() ?? "CO"}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {currentCompany?.name ?? "Company"}
          </p>

          <p className="truncate text-xs text-gray-500">
            {currentCompany?.code ?? ""}
          </p>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9AA198]">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition ${
                  item.active
                    ? "text-[var(--brand-color)]"
                    : "text-[#697169] hover:bg-[#F2F4F0] hover:text-[#414940]"
                }`}
                style={
                  item.active
                    ? {
                        backgroundColor: "var(--brand-color-soft)",
                      }
                    : undefined
                }
              >
                <Icon size={16} strokeWidth={1.9} />
                {item.label}
              </button>
            );
          })}
        </div>

        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9AA198]">
          Administration
        </p>

        <button
          type="button"
          onClick={() => router.push("/settings/company")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium text-[#697169] transition hover:bg-[#F2F4F0] hover:text-[#414940]"
        >
          <Settings size={16} strokeWidth={1.9} />
          Company Settings
        </button>
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#E8EBE5] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#697169] transition hover:bg-[#F2F4F0]"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
