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
          { label: "Departments", href: "/organization/departments" },
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
    items: [
      { label: "Company settings", href: "/settings/company", icon: Settings },
    ],
  },
];

/* ---------- shared styles ---------- */

const ROW =
  "group relative flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-[12.5px] leading-5 font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFBF9]";

// The one loud moment: the current page is a solid brand-colored pill.
const ROW_CURRENT =
  "bg-[var(--brand-color)] text-white shadow-[0_6px_14px_-6px_var(--brand-color)]";
// A parent whose child is the current page: tinted, quieter.
const ROW_TRAIL = "bg-[var(--brand-color-soft)] text-[var(--brand-color)]";
const ROW_IDLE = "text-[#566055] hover:bg-[#F0F2ED] hover:text-[#1F251E]";

const TILE =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 motion-reduce:transition-none";
const TILE_CURRENT = "bg-white/20 text-white";
const TILE_TRAIL = "bg-white text-[var(--brand-color)]";
const TILE_IDLE =
  "bg-white text-[#6B746A] ring-1 ring-[#E4E8E1] group-hover:text-[#1F251E]";

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
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#E4E8E1] bg-[#FBFBF9] lg:flex">
      {/* Brand */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E4E8E1] bg-white p-2.5 shadow-[0_1px_2px_rgba(31,37,30,0.04)]">
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
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-2 [scrollbar-width:thin]"
      >
        {NAV.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-xs font-semibold text-[#8A9288]">
              {section.title}
            </p>

            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = matches(item.href, item.exact);

                /* ---- single link ---- */
                if (!item.children) {
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`${ROW} ${active ? ROW_CURRENT : ROW_IDLE}`}
                      >
                        <span
                          className={`${TILE} ${active ? TILE_CURRENT : TILE_IDLE}`}
                        >
                          <Icon size={15} strokeWidth={1.9} />
                        </span>
                        <span className="truncate text-[12.5px] leading-5">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                }

                /* ---- expandable group ---- */
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
                        active ? ROW_TRAIL : ROW_IDLE
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={`${TILE} ${active ? TILE_TRAIL : TILE_IDLE}`}
                        >
                          <Icon size={15} strokeWidth={1.9} />
                        </span>
                        <span className="truncate text-[12.5px] leading-5">
                          {item.label}
                        </span>
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={2}
                        className={`mr-1 shrink-0 opacity-60 transition-transform duration-200 motion-reduce:transition-none ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Animated expand / collapse */}
                    <div
                      className={`grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none ${
                        expanded
                          ? "visible grid-rows-[1fr]"
                          : "invisible grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ul className="relative ml-[22px] mt-1 space-y-0.5 border-l border-[#E4E8E1] pb-0.5 pl-3">
                          {item.children.map((child) => {
                            const childActive = matches(
                              child.href,
                              child.exact,
                            );
                            return (
                              <li key={child.href} className="relative">
                                {/* Dot on the guide line marks the current child */}
                                {childActive && (
                                  <span
                                    aria-hidden
                                    className="absolute -left-[16.5px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ring-4 ring-[#FBFBF9]"
                                    style={{
                                      backgroundColor: "var(--brand-color)",
                                    }}
                                  />
                                )}
                                <Link
                                  href={child.href}
                                  aria-current={
                                    childActive ? "page" : undefined
                                  }
                                  className={`flex items-center rounded-lg px-2.5 py-1.5 text-[12px] leading-5 font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] ${
                                    childActive
                                      ? "bg-[var(--brand-color-soft)] font-semibold text-[var(--brand-color)]"
                                      : "text-[#6B746A] hover:bg-[#F0F2ED] hover:text-[#1F251E]"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
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
          <span
            className={`${TILE} ${TILE_IDLE} group-hover:!bg-white group-hover:!text-red-600 group-hover:!ring-red-100`}
          >
            <LogOut size={15} strokeWidth={1.9} />
          </span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
