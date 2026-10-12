"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  Users,
  X,
} from "lucide-react";

import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import AuditLogModal from "@/features/company/components/AuditLogModal";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import {
  type Client,
  type ClientPayload,
  createClient,
  getClients,
  updateClient,
  updateClientStatus,
} from "@/features/company/services/clientService";
import {
  type AuditLog,
  getEntityAuditLogs,
} from "@/features/company/services/auditLogService";

type ClientManagementProps = {
  companyId: number | null;
};

const EMPTY_FORM: ClientPayload = {
  name: "",
  code: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  description: "",
  is_active: true,
};

export default function ClientManagement({ companyId }: ClientManagementProps) {
  const { showSuccess, showError } = useSnackbar();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientPayload>(EMPTY_FORM);

  const [statusClient, setStatusClient] = useState<Client | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [activityClient, setActivityClient] = useState<Client | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Debounce search.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Load clients using server-side search and pagination.
  useEffect(() => {
    if (companyId === null) {
      return;
    }

    let cancelled = false;
    const activeCompanyId = companyId;

    async function loadClients() {
      try {
        setLoading(true);
        setError(null);

        const data = await getClients(activeCompanyId, {
          page,
          page_size: pageSize,
          search,
        });

        if (cancelled) return;

        setClients(data.clients);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Unable to load clients.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, [companyId, page, pageSize, search, refreshKey]);

  function openCreateModal() {
    setEditingClient(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      code: client.code ?? "",
      contact_person: client.contact_person ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      country: client.country ?? "India",
      description: client.description ?? "",
      is_active: client.is_active,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingClient(null);
    setForm({ ...EMPTY_FORM });
    setError(null);
  }

  function updateField(field: keyof ClientPayload, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function formatLocation(client: Client) {
    return [client.city, client.state].filter(Boolean).join(", ");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) return;

    const name = form.name?.trim() ?? "";

    if (!name) {
      setError("Client name is required.");
      return;
    }

    const payload: ClientPayload = {
      name,
      code: form.code?.trim() || null,
      contact_person: form.contact_person?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || "India",
      description: form.description?.trim() || null,
    };

    try {
      setSaving(true);
      setError(null);

      if (editingClient) {
        await updateClient(companyId, editingClient.id, payload);
        showSuccess("Client updated successfully.");
      } else {
        await createClient(companyId, {
          ...payload,
          is_active: form.is_active !== false,
        });

        setSearchInput("");
        setSearch("");
        setPage(1);
        showSuccess("Client created successfully.");
      }

      // Close directly because closeModal prevents closing while saving.
      setModalOpen(false);
      setEditingClient(null);
      setForm({ ...EMPTY_FORM });
      setRefreshKey((current) => current + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save client.";

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusConfirm() {
    if (companyId === null || statusClient === null) return;

    const client = statusClient;
    const nextStatus = !client.is_active;

    try {
      setStatusLoading(true);

      await updateClientStatus(companyId, client.id, nextStatus);

      setStatusClient(null);
      setRefreshKey((current) => current + 1);

      showSuccess(
        nextStatus
          ? "Client enabled successfully."
          : "Client disabled successfully.",
      );
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Unable to update client status.",
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function openActivity(client: Client) {
    if (companyId === null) return;

    setActivityClient(client);
    setActivityLogs([]);
    setActivityError(null);
    setActivityLoading(true);

    try {
      const logs = await getEntityAuditLogs(companyId, "CLIENT", client.id);
      setActivityLogs(logs);
    } catch (err) {
      setActivityError(
        err instanceof Error ? err.message : "Unable to load client activity.",
      );
    } finally {
      setActivityLoading(false);
    }
  }

  function closeActivity() {
    setActivityClient(null);
    setActivityLogs([]);
    setActivityError(null);
  }

  if (companyId === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Select a company to manage clients.
      </div>
    );
  }

  const hasSearch = Boolean(searchInput.trim() || search);

  return (
    <>
      <div className="space-y-4 p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Clients</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage clients and operational customer accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            <Plus size={15} className="mr-1.5" />
            Add Client
          </button>
        </div>

        {/* Search and summary */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search clients..."
              aria-label="Search clients"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            />
          </div>

          <p className="text-xs text-slate-500">
            {total} {total === 1 ? "client" : "clients"}
          </p>
        </div>

        {/* Error */}
        {error && !modalOpen && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        {/* Clients table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-slate-500">
              Loading clients...
            </div>
          ) : clients.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                <Users size={20} />
              </div>

              <h3 className="mt-3 text-sm font-medium text-slate-900">
                {hasSearch ? "No clients found" : "No clients yet"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {hasSearch
                  ? "Try a different search term."
                  : "Create your first client to get started."}
              </p>

              {!hasSearch && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 inline-flex items-center text-xs font-medium text-[var(--brand-color)] hover:underline"
                >
                  <Plus size={14} className="mr-1" />
                  Add client
                </button>
              )}
            </div>
          ) : (
            <div className="h-[clamp(220px,calc(100dvh-360px),760px)] overflow-x-auto overflow-y-auto overscroll-contain">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Client
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className={`transition-colors ${
                        client.is_active
                          ? "hover:bg-slate-50/60"
                          : "bg-slate-50/70 text-slate-500 hover:bg-slate-100/70"
                      }`}
                    >
                      <td className="max-w-[220px] px-3 py-1.5">
                        <div
                          className={`truncate text-xs font-medium ${
                            client.is_active
                              ? "text-slate-900"
                              : "text-slate-500"
                          }`}
                          title={client.name}
                        >
                          {client.name}
                        </div>

                        {client.description && (
                          <div
                            className="mt-0.5 max-w-xs truncate text-[11px] leading-4 text-slate-500"
                            title={client.description}
                          >
                            {client.description}
                          </div>
                        )}
                      </td>

                      <td className="max-w-[220px] px-3 py-1.5">
                        <div className="truncate text-xs leading-4 text-slate-700">
                          {client.contact_person || "—"}
                        </div>

                        {client.email && (
                          <div
                            className="mt-0.5 truncate text-[11px] leading-4 text-slate-500"
                            title={client.email}
                          >
                            {client.email}
                          </div>
                        )}

                        {client.phone && (
                          <div className="truncate text-[11px] leading-4 text-slate-500">
                            {client.phone}
                          </div>
                        )}
                      </td>

                      <td className="max-w-[180px] px-3 py-1.5">
                        {formatLocation(client) ? (
                          <div
                            className="flex items-center gap-1.5 truncate text-xs text-slate-600"
                            title={formatLocation(client)}
                          >
                            <MapPin
                              size={13}
                              className="shrink-0 text-slate-400"
                            />
                            <span className="truncate">
                              {formatLocation(client)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-1.5 text-xs text-slate-600">
                        {client.code || "—"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            client.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {client.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-1.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(client)}
                            title="Edit client"
                            aria-label={`Edit ${client.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusClient(client)}
                            disabled={statusLoading}
                            title={
                              client.is_active
                                ? "Disable client"
                                : "Enable client"
                            }
                            aria-label={
                              client.is_active
                                ? `Disable ${client.name}`
                                : `Enable ${client.name}`
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Power size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void openActivity(client)}
                            title="View activity"
                            aria-label={`View activity for ${client.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
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

          {/* Pagination stays outside the scrolling table */}
          {!loading && total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Rows per page</span>

                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[var(--brand-color)]"
                  aria-label="Rows per page"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                <span>
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, total)} of {total}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="text-xs text-slate-500">
                  Page {totalPages === 0 ? 0 : page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                  className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages || loading}
                  className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-modal-title"
          >
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div>
                  <h3
                    id="client-modal-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    {editingClient ? "Edit Client" : "Add Client"}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingClient
                      ? "Update the client details."
                      : "Create a new operational client."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close modal"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:col-span-2">
                      {error}
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="client-name"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Client Name *
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      value={form.name ?? ""}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      required
                      maxLength={150}
                      autoFocus
                      placeholder="Enter client name"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-code"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Client Code
                    </label>
                    <input
                      id="client-code"
                      type="text"
                      value={form.code ?? ""}
                      onChange={(event) =>
                        updateField("code", event.target.value)
                      }
                      maxLength={50}
                      placeholder="e.g. CLI-001"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-contact"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Contact Person
                    </label>
                    <input
                      id="client-contact"
                      type="text"
                      value={form.contact_person ?? ""}
                      onChange={(event) =>
                        updateField("contact_person", event.target.value)
                      }
                      maxLength={150}
                      placeholder="Contact person's name"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-phone"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Phone
                    </label>
                    <input
                      id="client-phone"
                      type="tel"
                      value={form.phone ?? ""}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      maxLength={30}
                      placeholder="Phone number"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-email"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="client-email"
                      type="email"
                      value={form.email ?? ""}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      maxLength={255}
                      placeholder="name@example.com"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="client-address"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Address
                    </label>
                    <textarea
                      id="client-address"
                      value={form.address ?? ""}
                      onChange={(event) =>
                        updateField("address", event.target.value)
                      }
                      rows={2}
                      placeholder="Street address"
                      className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-city"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      City
                    </label>
                    <input
                      id="client-city"
                      type="text"
                      value={form.city ?? ""}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      maxLength={100}
                      placeholder="City"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-state"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      State
                    </label>
                    <input
                      id="client-state"
                      type="text"
                      value={form.state ?? ""}
                      onChange={(event) =>
                        updateField("state", event.target.value)
                      }
                      maxLength={100}
                      placeholder="State"
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-country"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Country
                    </label>
                    <input
                      id="client-country"
                      type="text"
                      value={form.country ?? "India"}
                      onChange={(event) =>
                        updateField("country", event.target.value)
                      }
                      maxLength={100}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="client-description"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="client-description"
                      value={form.description ?? ""}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      rows={3}
                      placeholder="Optional client description"
                      className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  {!editingClient && (
                    <label className="flex cursor-pointer items-start gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={form.is_active !== false}
                        onChange={(event) =>
                          updateField("is_active", event.target.checked)
                        }
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-[var(--brand-color)]"
                      />
                      <span>
                        <span className="block text-xs font-medium text-slate-700">
                          Active
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          Allow this client to be used in the system.
                        </span>
                      </span>
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-8 rounded-md px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-8 rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingClient
                        ? "Update Client"
                        : "Create Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <StatusConfirmModal
        open={statusClient !== null}
        entityName={statusClient?.name ?? ""}
        entityType="client"
        isActive={statusClient?.is_active ?? false}
        loading={statusLoading}
        onConfirm={() => void handleStatusConfirm()}
        onClose={() => {
          if (!statusLoading) setStatusClient(null);
        }}
      />

      <AuditLogModal
        open={activityClient !== null}
        entityName={activityClient?.name ?? ""}
        logs={activityLogs}
        loading={activityLoading}
        error={activityError}
        onClose={closeActivity}
      />
    </>
  );
}
