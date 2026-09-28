"use client";

import {
  BarChart3,
  Building2,
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
  const { clearCompanyState } = useCompany();
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
      <div className="flex h-[76px] items-center gap-3 border-b border-[#E8EBE5] px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5F8F59] text-white shadow-sm">
          <Building2 size={18} strokeWidth={2.2} />
        </div>

        <div>
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-[#29352A]">
            HRMS
          </p>
          <p className="text-[10px] text-[#899188]">Workforce platform</p>
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
                    ? "bg-[#EAF2E7] text-[#4E704A]"
                    : "text-[#697169] hover:bg-[#F2F4F0] hover:text-[#414940]"
                }`}
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
