"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  Building2,
  X,
} from "lucide-react";

import {
  Site,
  SitePayload,
  createSite,
  getSites,
  updateSite,
} from "@/features/company/services/siteService";
import { Client, getClients } from "@/features/company/services/clientService";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import AuditLogModal from "@/features/company/components/AuditLogModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import {
  AuditLog,
  getEntityAuditLogs,
} from "@/features/company/services/auditLogService";

type SiteManagementProps = {
  companyId: number | null;
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
  is_active: true,
};

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-color)]";

const labelClass =
  "mb-1.5 block text-sm font-medium text-[var(--text-primary)]";

const textareaClass =
  "w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-color)]";

export default function SiteManagement({ companyId }: SiteManagementProps) {
  const { showSnackbar } = useSnackbar();

  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [form, setForm] = useState<SitePayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [statusSite, setStatusSite] = useState<Site | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [activitySite, setActivitySite] = useState<Site | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId === null) {
      return;
    }

    let cancelled = false;
    const activeCompanyId = companyId;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [siteData, clientData] = await Promise.all([
          getSites(activeCompanyId),
          getClients(activeCompanyId),
        ]);

        if (cancelled) return;

        setSites(siteData);
        setClients(clientData);
      } catch (err) {
        if (cancelled) return;

        setError(err instanceof Error ? err.message : "Unable to load sites.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients],
  );

  const activeClients = useMemo(
    () => clients.filter((client) => client.is_active),
    [clients],
  );

  const filteredSites = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return sites;

    return sites.filter((site) => {
      const clientName = clientNames.get(site.client_id) ?? "";

      return [
        site.name,
        site.code,
        site.site_type,
        site.address,
        site.city,
        site.state,
        site.country,
        site.contact_person,
        site.phone,
        site.email,
        clientName,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value));
    });
  }, [sites, search, clientNames]);

  function openCreateModal() {
    if (activeClients.length === 0) {
      showSnackbar("Create an active client before adding a site.", "error");
      return;
    }

    setEditingSite(null);
    setForm({
      ...emptyForm,
      client_id: activeClients[0].id,
      is_active: true,
    });
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
      is_active: site.is_active,
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingSite(null);
    setForm(emptyForm);
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
      address: form.address?.trim() ?? "",
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || "India",
      postal_code: form.postal_code?.trim() || null,
      contact_person: form.contact_person?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      description: form.description?.trim() || null,
      is_active: form.is_active !== false,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) return;

    if (!form.client_id || !form.name?.trim() || !form.address?.trim()) {
      showSnackbar("Client, site name, and address are required.", "error");
      return;
    }

    if (!clients.some((client) => client.id === Number(form.client_id))) {
      showSnackbar("Select a valid client.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();
      let result: Site;

      if (editingSite) {
        result = await updateSite(companyId, editingSite.id, payload);

        setSites((current) =>
          current.map((item) => (item.id === result.id ? result : item)),
        );

        showSnackbar("Site updated successfully.", "success");
      } else {
        result = await createSite(companyId, payload);

        setSites((current) =>
          [...current, result].sort((a, b) => a.name.localeCompare(b.name)),
        );

        showSnackbar("Site created successfully.", "success");
      }

      setModalOpen(false);
      setEditingSite(null);
      setForm(emptyForm);
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

      // The Sites API uses PUT for updates; it does not use the
      // Clients module's separate PATCH /status endpoint.
      const payload: SitePayload = {
        client_id: statusSite.client_id,
        name: statusSite.name,
        code: statusSite.code ?? null,
        site_type: statusSite.site_type ?? null,
        address: statusSite.address,
        city: statusSite.city ?? null,
        state: statusSite.state ?? null,
        country: statusSite.country ?? "India",
        postal_code: statusSite.postal_code ?? null,
        contact_person: statusSite.contact_person ?? null,
        phone: statusSite.phone ?? null,
        email: statusSite.email ?? null,
        description: statusSite.description ?? null,
        is_active: !statusSite.is_active,
      };

      const result = await updateSite(companyId, statusSite.id, payload);

      setSites((current) =>
        current.map((item) => (item.id === result.id ? result : item)),
      );

      showSnackbar(
        result.is_active
          ? "Site enabled successfully."
          : "Site disabled successfully.",
        "success",
      );

      setStatusSite(null);
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
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {" "}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {" "}
        <div>
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <Building2 size={20} className="text-[var(--brand-color)]" />{" "}
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Sites{" "}
            </h1>{" "}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage client locations and site information.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          disabled={companyId === null || activeClients.length === 0}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add Site
        </button>
      </div>
      {companyId !== null && !loading && activeClients.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No active clients are available. Create or enable a client before
          adding a site.
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sites, clients, or locations..."
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">
            {error}
          </div>
        ) : loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
            Loading sites...
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Building2 size={28} className="mx-auto text-[var(--text-muted)]" />

            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              {search ? "No sites found" : "No sites yet"}
            </p>

            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {search
                ? "Try a different search."
                : "Add a site to start managing client locations."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left">
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Site
                  </th>
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Client
                  </th>
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Location
                  </th>
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Contact
                  </th>
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Code
                  </th>
                  <th className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSites.map((site) => (
                  <tr
                    key={site.id}
                    className={`border-b border-[var(--border)] last:border-0 ${
                      site.is_active ? "" : "opacity-60"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {site.name}
                      </div>
                      {site.site_type && (
                        <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {site.site_type}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[var(--text-primary)]">
                      {clientNames.get(site.client_id) ?? "Unknown client"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-1.5 text-[var(--text-primary)]">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                        />
                        <div>
                          <div>{formatLocation(site) || "—"}</div>
                          {site.address && (
                            <div className="mt-0.5 max-w-xs truncate text-xs text-[var(--text-muted)]">
                              {site.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-[var(--text-primary)]">
                        {site.contact_person || "—"}
                      </div>
                      {site.email && (
                        <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {site.email}
                        </div>
                      )}
                      {site.phone && (
                        <div className="text-xs text-[var(--text-muted)]">
                          {site.phone}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[var(--text-secondary)]">
                      {site.code || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          site.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {site.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEditModal(site)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title={site.is_active ? "Disable" : "Enable"}
                          onClick={() => setStatusSite(site)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Power size={16} />
                        </button>

                        <button
                          type="button"
                          title="Activity"
                          onClick={() => void openActivity(site)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Activity size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {editingSite ? "Edit Site" : "Add Site"}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {editingSite
                    ? "Update site and contact information."
                    : "Add a location for one of your clients."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Client *</label>
                  <select
                    value={form.client_id || ""}
                    onChange={(event) =>
                      updateField("client_id", Number(event.target.value))
                    }
                    required
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select a client
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {!client.is_active ? " (Inactive)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Each site belongs to one client.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Site Name *</label>
                  <input
                    value={form.name ?? ""}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    required
                    maxLength={200}
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
                    placeholder="e.g. Office, Warehouse, Plant"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Contact Person</label>
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
                    required
                    rows={2}
                    className={textareaClass}
                  />
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
                    required
                    maxLength={100}
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
                    rows={3}
                    className={textareaClass}
                  />
                </div>
              </div>

              {!editingSite && (
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
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

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:opacity-50"
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
