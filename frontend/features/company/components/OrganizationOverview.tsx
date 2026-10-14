"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Layers3,
  Users,
  BriefcaseBusiness,
  Handshake,
  Network,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Building,
} from "lucide-react";

type ModuleCount = {
  label: string;
  href: string;
  endpoint: string;
  icon: typeof Building2;
  color: string;
};

type HierarchyNode = {
  label: string;
  description: string;
  href: string;
  icon: typeof Building2;
  children?: HierarchyNode[];
};
import type { OrganizationConfiguration } from "@/features/company/services/organizationService";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const modules: ModuleCount[] = [
  {
    label: "Branches",
    href: "/organization/branches",
    endpoint: "branches",
    icon: MapPin,
    color: "text-teal-700 bg-teal-50",
  },
  {
    label: "Departments",
    href: "/organization/departments",
    endpoint: "departments",
    icon: Layers3,
    color: "text-violet-700 bg-violet-50",
  },
  {
    label: "Teams",
    href: "/organization/teams",
    endpoint: "teams",
    icon: Users,
    color: "text-blue-700 bg-blue-50",
  },
  {
    label: "Designations",
    href: "/organization/designations",
    endpoint: "designations",
    icon: BriefcaseBusiness,
    color: "text-amber-700 bg-amber-50",
  },
  {
    label: "Clients",
    href: "/organization/clients",
    endpoint: "clients",
    icon: Handshake,
    color: "text-pink-700 bg-pink-50",
  },
  {
    label: "Sites",
    href: "/organization/sites",
    endpoint: "sites",
    icon: Building,
    color: "text-indigo-700 bg-indigo-50",
  },
  {
    label: "Posts",
    href: "/organization/posts",
    endpoint: "posts",
    icon: Network,
    color: "text-orange-700 bg-orange-50",
  },
];

const companyHierarchy: HierarchyNode[] = [
  {
    label: "Branches",
    description: "Company locations and offices",
    href: "/organization/branches",
    icon: MapPin,
  },
  {
    label: "Departments",
    description: "Functional departments within the company",
    href: "/organization/departments",
    icon: Layers3,
    children: [
      {
        label: "Teams",
        description: "Teams grouped under departments",
        href: "/organization/teams",
        icon: Users,
      },
    ],
  },
  {
    label: "Designations",
    description: "Job titles and positions",
    href: "/organization/designations",
    icon: BriefcaseBusiness,
  },
];

const clientHierarchy: HierarchyNode[] = [
  {
    label: "Clients",
    description: "Customers served by the company",
    href: "/organization/clients",
    icon: Handshake,
    children: [
      {
        label: "Sites",
        description: "Operational locations for each client",
        href: "/organization/sites",
        icon: MapPin,
        children: [
          {
            label: "Posts",
            description: "Operational posts at each site",
            href: "/organization/posts",
            icon: Building,
          },
        ],
      },
    ],
  },
];

function HierarchySection({
  title,
  description,
  nodes,
}: {
  title: string;
  description: string;
  nodes: HierarchyNode[];
}) {
  const [expanded, setExpanded] = useState<string[]>([
    "Clients",
    "Sites",
    "Departments",
  ]);

  function toggle(label: string) {
    setExpanded((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  function renderNode(node: HierarchyNode, depth = 0): React.ReactNode {
    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expanded.includes(node.label);
    const Icon = node.icon;

    return (
      <div key={`${depth}-${node.label}`}>
        <div
          className="flex min-w-0 items-center gap-2 border-b border-gray-100 py-3 last:border-b-0"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          <div className="flex w-6 shrink-0 justify-center">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(node.label)}
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`}
                aria-expanded={isExpanded}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <span className="h-6 w-6" />
            )}
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Icon size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800">{node.label}</p>
            <p className="text-xs text-gray-500">{node.description}</p>
          </div>

          <Link
            href={node.href}
            aria-label={`Open ${node.label}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-800"
          >
            <ExternalLink size={15} />
          </Link>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="px-4 py-1">{nodes.map((node) => renderNode(node))}</div>
    </section>
  );
}

export default function OrganizationOverview({
  companyId,
  organizationConfiguration,
}: {
  companyId: number | null;
  organizationConfiguration: OrganizationConfiguration | null;
}) {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const organizationVisibility: Record<string, boolean> = {
    "/organization/branches":
      organizationConfiguration?.branches_enabled ?? true,
    "/organization/departments":
      organizationConfiguration?.departments_enabled ?? true,
    "/organization/teams": organizationConfiguration?.teams_enabled ?? true,
    "/organization/designations":
      organizationConfiguration?.designations_enabled ?? true,
    "/organization/clients": organizationConfiguration?.clients_enabled ?? true,
    "/organization/sites": organizationConfiguration?.sites_enabled ?? true,
    "/organization/posts": organizationConfiguration?.posts_enabled ?? true,
  };
  const loadCounts = useCallback(async () => {
    if (companyId === null) {
      setCounts({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        modules.map(async (module) => {
          const query = new URLSearchParams({
            page: "1",
            page_size: "1",
          });

          const response = await fetch(
            `${API_URL}/companies/${companyId}/${module.endpoint}?${query.toString()}`,
            {
              method: "GET",
              credentials: "include",
            },
          );

          if (!response.ok) {
            throw new Error(`Unable to load ${module.label.toLowerCase()}.`);
          }

          const data = await response.json();

          if (typeof data.total !== "number") {
            throw new Error(
              `The ${module.label.toLowerCase()} response does not include a total count.`,
            );
          }

          return [module.endpoint, data.total] as const;
        }),
      );

      setCounts(Object.fromEntries(results));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load organization summary.",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadCounts();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadCounts]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 text-gray-900 sm:p-6 lg:p-7">
      <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-medium text-teal-700">Organization</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Organization Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Manage your company structure and client operations from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCounts()}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh counts
        </button>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-semibold text-gray-900">Organization summary</h2>
          <p className="mt-1 text-sm text-gray-500">
            Current record totals for the selected company.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadCounts()}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules
            .filter((module) => organizationVisibility[module.href] !== false)
            .map((module) => {
              const Icon = module.icon;
              const count = counts[module.endpoint];

              return (
                <Link
                  key={module.endpoint}
                  href={module.href}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${module.color}`}
                    >
                      <Icon size={20} />
                    </div>
                    <ExternalLink
                      size={15}
                      className="text-gray-300 transition group-hover:text-teal-700"
                    />
                  </div>

                  <p className="mt-4 text-sm font-medium text-gray-500">
                    {module.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {loading
                      ? "—"
                      : typeof count === "number"
                        ? count.toLocaleString()
                        : "—"}
                  </p>
                </Link>
              );
            })}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <HierarchySection
          title="Company Structure"
          description="Branches, departments, teams, and designations."
          nodes={companyHierarchy}
        />

        <HierarchySection
          title="Client Operations"
          description="Clients, their sites, and operational posts."
          nodes={clientHierarchy}
        />
      </div>
    </div>
  );
}
