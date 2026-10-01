"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { logoutAccount } from "@/features/auth/services/logoutService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useCompany } from "@/features/company/context/CompanyContext";

type NavChild = { label: string; href: string; exact?: boolean };
type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  children?: NavChild[];
};
type NavSection = { title: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    title: "Workspace",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      { label: "Employees", href: "/employees", icon: Users },
      {
        label: "Organization",
        href: "/organization",
        icon: Building2,
        children: [
          { label: "Overview", href: "/organization", exact: true },
          { label: "Branches", href: "/organization/branches" },
        ],
      },
      {
        label: "Workforce",
        href: "/workforce",
        icon: BriefcaseBusiness,
        children: [
          { label: "Overview", href: "/workforce", exact: true },
          { label: "Employment types", href: "/workforce/employment-types" },
        ],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Attendance", href: "/attendance", icon: ClipboardList },
      { label: "Leave", href: "/leave", icon: CalendarDays },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Tickets", href: "/tickets", icon: FileText },
      { label: "Assets", href: "/assets", icon: Package },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    items: [{ label: "Company settings", href: "/settings", icon: Settings }],
  },
];

const ROW =
  "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] leading-5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-1";
const ROW_IDLE = "text-[#5F685E] hover:bg-[#F1F3EE] hover:text-[#2B312A]";
const ROW_ACTIVE = "bg-[var(--brand-color-soft)] text-[var(--brand-color)]";

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const { setCurrentUser } = useAuth();
  const { clearCompanyState, currentCompany } = useCompany();

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const logoUrl = currentCompany?.logo
    ? currentCompany.logo.startsWith("http")
      ? currentCompany.logo
      : `${API_URL}${currentCompany.logo}`
    : null;

  const matches = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  // Which groups are expanded (keyed by href). Auto-open the group for the current route.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    NAV.flatMap((s) => s.items)
      .filter((i) => i.children && matches(i.href))
      .forEach((i) => setOpen((prev) => ({ ...prev, [i.href]: true })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[#E4E8E1] bg-[#FBFBF9] lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-black/5"
          style={{
            backgroundColor: logoUrl ? "#fff" : "var(--brand-color-soft)",
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
          <p className="truncate text-sm font-semibold text-[#1F251E]">
            {currentCompany?.name ?? "Company"}
          </p>
          {currentCompany?.code && (
            <p className="truncate text-xs text-[#8A9288]">
              {currentCompany.code}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-1"
      >
        {NAV.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-xs font-medium text-[#8A9288]">
              {section.title}
            </p>

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = matches(item.href, item.exact);

                if (!item.children) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`${ROW} ${active ? ROW_ACTIVE : ROW_IDLE}`}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                            style={{ backgroundColor: "var(--brand-color)" }}
                          />
                        )}
                        <Icon
                          size={16}
                          strokeWidth={1.8}
                          className="shrink-0"
                        />
                        <span className="truncate text-[12.5px] leading-5">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                }

                const expanded = !!open[item.href];

                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setOpen((p) => ({ ...p, [item.href]: !p[item.href] }))
                      }
                      className={`${ROW} justify-between !text-[12.5px] !font-medium ${
                        active && !expanded
                          ? ROW_ACTIVE
                          : active
                            ? "text-[var(--brand-color)]"
                            : ROW_IDLE
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          size={16}
                          strokeWidth={1.8}
                          className="shrink-0"
                        />
                        <span className="truncate text-[12.5px] leading-5">
                          {item.label}
                        </span>
                      </span>
                      <ChevronDown
                        size={13}
                        strokeWidth={2}
                        className={`shrink-0 opacity-60 transition-transform duration-200 ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expanded && (
                      <ul className="ml-[18px] mt-0.5 space-y-0.5 border-l border-[#E4E8E1] pl-2.5">
                        {item.children.map((child) => {
                          const childActive = matches(child.href, child.exact);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                aria-current={childActive ? "page" : undefined}
                                className={`flex items-center rounded-md px-2.5 py-1 text-[12px] leading-5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] ${
                                  childActive
                                    ? "bg-[var(--brand-color-soft)] text-[var(--brand-color)]"
                                    : "text-[#6B746A] hover:bg-[#F1F3EE] hover:text-[#2B312A]"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-[#E4E8E1] p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={`${ROW} ${ROW_IDLE} hover:!bg-red-50 hover:!text-red-700`}
        >
          <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
