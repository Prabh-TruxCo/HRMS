"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";

import {
  Site,
  SitePayload,
  SiteListResponse,
  createSite,
  getSites,
  updateSite,
} from "@/features/company/services/siteService";
import { Client, getClients } from "@/features/company/services/clientService";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import AuditLogModal from "@/features/company/components/AuditLogModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import OfficeLocationMapPicker from "@/features/company/components/OfficeLocationMapPicker";
import {
  AuditLog,
  getEntityAuditLogs,
} from "@/features/company/services/auditLogService";

type SiteManagementProps = {
  companyId: number | null;
};

type ClientDetails = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
};

const emptyForm: SitePayload = {
  client_id: 0,
  name: "",
  code: "",
  site_type: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",
  contact_person: "",
  phone: "",
  email: "",
  description: "",
  latitude: null,
  longitude: null,
  geofence_radius: 100,
  is_geofence_enabled: false,
  is_active: true,
};

const inputClass =
  "h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]";

const labelClass = "mb-1 block text-xs font-medium text-[var(--text-primary)]";

function clientDefaults(client: Client): Partial<SitePayload> {
  const details = client as Client & ClientDetails;

  return {
    address: details.address ?? "",
    city: details.city ?? "",
    state: details.state ?? "",
    country: details.country ?? "India",
    postal_code: details.postal_code ?? "",
    contact_person: details.contact_person ?? "",
    phone: details.phone ?? "",
    email: details.email ?? "",
  };
}

export default function SiteManagement({ companyId }: SiteManagementProps) {
  const { showSnackbar } = useSnackbar();

  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientResults, setClientResults] = useState<Client[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<SiteListResponse>({
    sites: [],
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form, setForm] = useState<SitePayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  const [statusSite, setStatusSite] = useState<Site | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [activitySite, setActivitySite] = useState<Site | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Debounce the sites search to avoid making a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadSites = useCallback(
    async (signal?: AbortSignal) => {
      if (companyId === null) return;

      try {
        setLoading(true);
        setError(null);

        const result = await getSites(companyId, {
          page,
          page_size: pageSize,
          search: debouncedSearch,
        });

        if (signal?.aborted) return;

        setSites(result.sites);
        setPagination(result);
      } catch (err) {
        if (signal?.aborted) return;

        setError(err instanceof Error ? err.message : "Unable to load sites.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [companyId, page, pageSize, debouncedSearch],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      void loadSites(controller.signal);
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadSites]);

  // Load clients for table labels and the initial client selector.
  useEffect(() => {
    if (companyId === null) {
      return;
    }

    let cancelled = false;
    const activeCompanyId = companyId;

    async function loadClients() {
      try {
        const result = await getClients(activeCompanyId, {
          page: 1,
          page_size: 30,
        });

        if (!cancelled) {
          setClients(result.clients);
        }
      } catch (err) {
        if (!cancelled) {
          showSnackbar(
            err instanceof Error ? err.message : "Unable to load clients.",
            "error",
          );
        }
      }
    }

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, [companyId, showSnackbar]);

  // Search clients from the API, so the selector also works with
  // companies that have more clients than the initial page.
  useEffect(() => {
    if (!modalOpen || companyId === null) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setClientLoading(true);

        const result = await getClients(companyId, {
          page: 1,
          page_size: 20,
          search: clientSearch.trim() || undefined,
        });

        if (cancelled) return;

        setClientResults(result.clients);

        setClients((current) => {
          const merged = new Map(current.map((client) => [client.id, client]));

          result.clients.forEach((client) => {
            merged.set(client.id, client);
          });

          return Array.from(merged.values());
        });
      } catch (err) {
        if (!cancelled) {
          showSnackbar(
            err instanceof Error ? err.message : "Unable to search clients.",
            "error",
          );
        }
      } finally {
        if (!cancelled) {
          setClientLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [companyId, modalOpen, clientSearch, showSnackbar]);

  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients],
  );

  const activeClients = useMemo(
    () => clients.filter((client) => client.is_active),
    [clients],
  );

  const selectableClients = useMemo(
    () =>
      clientResults.filter(
        (client) =>
          client.is_active ||
          (editingSite !== null && client.id === editingSite.client_id),
      ),
    [clientResults, editingSite],
  );

  const totalPages = pagination.total_pages;
  const firstRow = pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, pagination.total);

  function selectClient(client: Client) {
    setForm((current) => ({
      ...current,
      client_id: client.id,
      ...clientDefaults(client),
    }));

    setClientSearch(client.name);
    setClientPickerOpen(false);
  }

  function openCreateModal() {
    if (activeClients.length === 0) {
      showSnackbar("Create an active client before adding a site.", "error");
      return;
    }

    setEditingSite(null);
    setForm({
      ...emptyForm,
      client_id: 0,
    });
    setClientSearch("");
    setClientPickerOpen(false);
    setModalOpen(true);
  }

  function openEditModal(site: Site) {
    setEditingSite(site);

    setForm({
      client_id: site.client_id,
      name: site.name,
      code: site.code ?? "",
      site_type: site.site_type ?? "",
      address: site.address ?? "",
      city: site.city ?? "",
      state: site.state ?? "",
      country: site.country ?? "India",
      postal_code: site.postal_code ?? "",
      contact_person: site.contact_person ?? "",
      phone: site.phone ?? "",
      email: site.email ?? "",
      description: site.description ?? "",
      latitude: site.latitude ?? null,
      longitude: site.longitude ?? null,
      geofence_radius: site.geofence_radius ?? 100,
      is_geofence_enabled: site.is_geofence_enabled ?? false,
      is_active: site.is_active,
    });

    const client = clients.find((item) => item.id === site.client_id);

    setClientSearch(client?.name ?? "");
    setClientPickerOpen(false);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingSite(null);
    setForm(emptyForm);
    setClientSearch("");
    setClientPickerOpen(false);
  }

  function updateField(
    field: keyof SitePayload,
    value: string | number | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function buildPayload(): SitePayload {
    return {
      client_id: Number(form.client_id),
      name: form.name.trim(),
      code: form.code?.trim() || null,
      site_type: form.site_type?.trim() || null,
      address: form.address?.trim() || "",
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || "India",
      postal_code: form.postal_code?.trim() || null,
      contact_person: form.contact_person?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      description: form.description?.trim() || null,
      is_active: form.is_active !== false,

      // Geopoint and geofence fields
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      geofence_radius: form.geofence_radius ?? null,
      is_geofence_enabled: form.is_geofence_enabled ?? false,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) return;

    const selectedClient = clients.find(
      (client) => client.id === Number(form.client_id),
    );

    if (!selectedClient) {
      showSnackbar("Please select a valid client.", "error");
      return;
    }

    if (!editingSite && !selectedClient.is_active) {
      showSnackbar(
        "An inactive client cannot be assigned to a new site.",
        "error",
      );
      return;
    }

    if (!form.name?.trim() || !form.address?.trim()) {
      showSnackbar("Site name and address are required.", "error");
      return;
    }
    if (form.is_geofence_enabled) {
      if (form.latitude == null || form.longitude == null) {
        showSnackbar(
          "Select the site location on the map before enabling geofencing.",
          "error",
        );
        return;
      }

      if (
        form.geofence_radius == null ||
        !Number.isInteger(form.geofence_radius) ||
        form.geofence_radius <= 0
      ) {
        showSnackbar(
          "Enter a valid geofence radius greater than zero.",
          "error",
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload = buildPayload();
      if (editingSite) {
        await updateSite(companyId, editingSite.id, payload);
        showSnackbar("Site updated successfully.", "success");
      } else {
        await createSite(companyId, payload);
        showSnackbar("Site created successfully.", "success");
      }

      setModalOpen(false);
      setEditingSite(null);
      setForm(emptyForm);
      setClientSearch("");
      setClientPickerOpen(false);

      // Refresh the current page and total count from the server.
      await loadSites();
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Unable to save site.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusConfirm() {
    if (companyId === null || statusSite === null) return;

    try {
      setStatusLoading(true);

      const payload: SitePayload = {
        client_id: statusSite.client_id,
        name: statusSite.name,
        code: statusSite.code,
        site_type: statusSite.site_type,
        address: statusSite.address,
        city: statusSite.city,
        state: statusSite.state,
        country: statusSite.country,
        postal_code: statusSite.postal_code,
        contact_person: statusSite.contact_person,
        phone: statusSite.phone,
        email: statusSite.email,
        description: statusSite.description,
        latitude: statusSite.latitude ?? null,
        longitude: statusSite.longitude ?? null,
        geofence_radius: statusSite.geofence_radius ?? null,
        is_geofence_enabled: statusSite.is_geofence_enabled ?? false,
        is_active: !statusSite.is_active,
      };

      await updateSite(companyId, statusSite.id, payload);

      showSnackbar(
        statusSite.is_active
          ? "Site disabled successfully."
          : "Site enabled successfully.",
        "success",
      );

      setStatusSite(null);
      await loadSites();
    } catch (err) {
      showSnackbar(
        err instanceof Error ? err.message : "Unable to update site status.",
        "error",
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function openActivity(site: Site) {
    if (companyId === null) return;

    setActivitySite(site);
    setActivityLogs([]);
    setActivityError(null);
    setActivityLoading(true);

    try {
      const logs = await getEntityAuditLogs(companyId, "SITE", site.id);

      setActivityLogs(logs);
    } catch (err) {
      setActivityError(
        err instanceof Error ? err.message : "Unable to load site activity.",
      );
    } finally {
      setActivityLoading(false);
    }
  }

  function formatLocation(site: Site) {
    return [site.city, site.state].filter(Boolean).join(", ");
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={19} className="text-[var(--brand-color)]" />
            <h1 className="text-base font-semibold text-[var(--text-primary)]">
              Sites
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Manage client locations and site information.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={companyId === null || activeClients.length === 0}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--brand-color)] px-3 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />
          Add Site
        </button>
      </div>

      {companyId !== null && !loading && activeClients.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No active clients are available. Create or enable a client before
          adding a site.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search sites, clients, or locations..."
            className={`${inputClass} pl-9`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          {pagination.total} {pagination.total === 1 ? "site" : "sites"}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        {error ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadSites()}
              className="mt-3 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-muted)]"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading sites...
          </div>
        ) : sites.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Building2 size={26} className="mx-auto text-[var(--text-muted)]" />
            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {debouncedSearch ? "No sites found" : "No sites yet"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {debouncedSearch
                ? "Try a different search term."
                : "Add a site to start managing client locations."}
            </p>
          </div>
        ) : (
          <div className="h-[clamp(220px,calc(100dvh-360px),760px)] overflow-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-[var(--border)]">
                  {[
                    "Site",
                    "Client",
                    "Location",
                    "Contact",
                    "Code",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] ${
                        heading === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sites.map((site) => (
                  <tr
                    key={site.id}
                    className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]/50 ${
                      site.is_active ? "" : "opacity-60"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[var(--text-primary)]">
                        {site.name}
                      </div>
                      {site.site_type && (
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {site.site_type}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-[var(--text-primary)]">
                      {clientNames.get(site.client_id) ??
                        `Client #${site.client_id}`}
                    </td>

                    <td className="max-w-[230px] px-3 py-2.5">
                      <div className="flex items-start gap-1.5 text-[var(--text-primary)]">
                        <MapPin
                          size={13}
                          className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                        />
                        <div className="min-w-0">
                          <div>{formatLocation(site) || "—"}</div>
                          {site.address && (
                            <div className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                              {site.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="text-[var(--text-primary)]">
                        {site.contact_person || "—"}
                      </div>
                      {site.email && (
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {site.email}
                        </div>
                      )}
                      {site.phone && (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {site.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                      {site.code || "—"}
                    </td>

                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                          site.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {site.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Edit site"
                          onClick={() => openEditModal(site)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          title={
                            site.is_active ? "Disable site" : "Enable site"
                          }
                          onClick={() => setStatusSite(site)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Power size={14} />
                        </button>

                        <button
                          type="button"
                          title="View activity"
                          onClick={() => void openActivity(site)}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Activity size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>
              {firstRow}–{lastRow} of {pagination.total}
            </span>
            <span>·</span>
            <label htmlFor="site-page-size">Rows</label>
            <select
              id="site-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-7 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text-primary)]"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-7 items-center gap-1 rounded border border-[var(--border)] px-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="min-w-16 text-center text-xs text-[var(--text-secondary)]">
              Page {page} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              disabled={loading || totalPages === 0 || page >= totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(Math.max(totalPages, 1), current + 1),
                )
              }
              className="flex h-7 items-center gap-1 rounded border border-[var(--border)] px-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5">
          <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {editingSite ? "Edit Site" : "Add Site"}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {editingSite
                    ? "Update this site's details."
                    : "Choose a client and add its site details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                title="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <div className="relative sm:col-span-2">
                  <label className={labelClass}>Client *</label>

                  <div className="relative">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />

                    <input
                      value={clientSearch}
                      onFocus={() => setClientPickerOpen(true)}
                      onChange={(event) => {
                        setClientSearch(event.target.value);
                        setClientPickerOpen(true);

                        setForm((current) => ({
                          ...current,
                          client_id: 0,
                        }));
                      }}
                      placeholder="Type a client name to search..."
                      autoComplete="off"
                      required
                      className={`${inputClass} pl-9 pr-9`}
                    />

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                  </div>

                  {clientPickerOpen && (
                    <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                      {clientLoading ? (
                        <p className="px-3 py-3 text-xs text-[var(--text-secondary)]">
                          Searching clients...
                        </p>
                      ) : selectableClients.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-[var(--text-secondary)]">
                          No matching active clients found.
                        </p>
                      ) : (
                        selectableClients.map((client) => {
                          const details = client as Client & ClientDetails;

                          return (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => selectClient(client)}
                              className="flex w-full items-start gap-2 border-b border-[var(--border)] px-3 py-2.5 text-left last:border-0 hover:bg-[var(--surface-muted)]"
                            >
                              <Building2
                                size={15}
                                className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                                  {client.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">
                                  {[details.city, details.state]
                                    .filter(Boolean)
                                    .join(", ") || "No location saved"}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Selecting a client copies its address and contact details.
                    You can edit those details for this site.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Site Name *</label>
                  <input
                    value={form.name ?? ""}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    maxLength={200}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Site Code</label>
                  <input
                    value={form.code ?? ""}
                    onChange={(event) =>
                      updateField("code", event.target.value)
                    }
                    maxLength={50}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Site Type</label>
                  <input
                    value={form.site_type ?? ""}
                    onChange={(event) =>
                      updateField("site_type", event.target.value)
                    }
                    maxLength={100}
                    placeholder="Office, warehouse, plant..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Contact Person *</label>
                  <input
                    value={form.contact_person ?? ""}
                    onChange={(event) =>
                      updateField("contact_person", event.target.value)
                    }
                    maxLength={150}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    value={form.phone ?? ""}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    maxLength={30}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    maxLength={255}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Address *</label>
                  <textarea
                    value={form.address ?? ""}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    rows={2}
                    required
                    className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
                  />
                </div>
                {/* Geopoint and geofence settings */}
                <div className="space-y-3 rounded-lg border border-[var(--border)] p-3 sm:col-span-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      Geopoint & Geofence
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Select the site location on the map and optionally
                      restrict attendance to a radius around it.
                    </p>
                  </div>

                  <OfficeLocationMapPicker
                    latitude={form.latitude ?? null}
                    longitude={form.longitude ?? null}
                    radius={
                      form.is_geofence_enabled ? form.geofence_radius : null
                    }
                    onChange={({ latitude, longitude }) => {
                      setForm((current) => ({
                        ...current,
                        latitude,
                        longitude,
                      }));
                    }}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Latitude</label>
                      <input
                        value={form.latitude ?? ""}
                        readOnly
                        placeholder="Select a point on the map"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Longitude</label>
                      <input
                        value={form.longitude ?? ""}
                        readOnly
                        placeholder="Select a point on the map"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={form.is_geofence_enabled ?? false}
                      onChange={(event) => {
                        updateField(
                          "is_geofence_enabled",
                          event.target.checked,
                        );
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
                    />
                    <span>
                      <span className="block font-medium">Enable geofence</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                        Use this location and radius for location-based
                        attendance validation.
                      </span>
                    </span>
                  </label>

                  {form.is_geofence_enabled && (
                    <div className="max-w-xs">
                      <label className={labelClass}>
                        Geofence Radius (metres) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        required
                        value={form.geofence_radius ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;

                          setForm((current) => ({
                            ...current,
                            geofence_radius:
                              value === "" ? null : Number(value),
                          }));
                        }}
                        placeholder="e.g. 100"
                        className={inputClass}
                      />
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        The green circle previews the permitted radius.
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    value={form.city ?? ""}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    maxLength={100}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>State</label>
                  <input
                    value={form.state ?? ""}
                    onChange={(event) =>
                      updateField("state", event.target.value)
                    }
                    maxLength={100}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Country *</label>
                  <input
                    value={form.country ?? "India"}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                    maxLength={100}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input
                    value={form.postal_code ?? ""}
                    onChange={(event) =>
                      updateField("postal_code", event.target.value)
                    }
                    maxLength={20}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={form.description ?? ""}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    rows={2}
                    className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)]"
                  />
                </div>
              </div>

              {!editingSite && (
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={form.is_active !== false}
                    onChange={(event) =>
                      updateField("is_active", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-[var(--border)]"
                  />
                  Active
                </label>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-9 rounded-md border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || form.client_id === 0}
                  className="h-9 rounded-md bg-[var(--brand-color)] px-4 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSite
                      ? "Save Changes"
                      : "Create Site"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StatusConfirmModal
        open={statusSite !== null}
        entityName={statusSite?.name ?? ""}
        entityType="site"
        isActive={statusSite?.is_active ?? false}
        loading={statusLoading}
        onConfirm={handleStatusConfirm}
        onClose={() => (statusLoading ? undefined : setStatusSite(null))}
      />

      {activitySite && companyId !== null && (
        <AuditLogModal
          open
          entityName={activitySite.name}
          logs={activityLogs}
          loading={activityLoading}
          error={activityError}
          onClose={() => setActivitySite(null)}
        />
      )}
    </div>
  );
}
