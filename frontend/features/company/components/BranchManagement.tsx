"use client";

import { useEffect, useState } from "react";
import { Activity, Pencil, Power, Search } from "lucide-react";
import { useCompany } from "../context/CompanyContext";
import { useSnackbar } from "@/components/feedback/SnackbarProvider";
import AuditLogModal from "./AuditLogModal";
import {
  AuditLog,
  getEntityAuditLogs,
} from "@/features/company/services/auditLogService";
import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";
import {
  createBranch,
  getBranches,
  updateBranch,
  type Branch,
} from "../services/branchService";

type BranchForm = {
  name: string;
  code: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
};

const EMPTY_FORM: BranchForm = {
  name: "",
  code: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  is_active: true,
};

export default function BranchManagement() {
  const { currentCompany } = useCompany();

  const companyId = currentCompany?.id ?? null;

  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [statusBranch, setStatusBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const { showSuccess, showError } = useSnackbar();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntityName, setAuditEntityName] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce search so the API isn't called on every keystroke.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Load the selected page from the backend.
  useEffect(() => {
    // The component already renders the company-selection state when no
    // company is selected, so no state reset is needed here.
    if (companyId === null) {
      return;
    }

    const activeCompanyId = companyId;
    let cancelled = false;

    async function loadBranches() {
      try {
        setLoading(true);
        setError(null);

        const result = await getBranches(activeCompanyId, {
          page,
          page_size: pageSize,
          search,
        });

        if (!cancelled) {
          setBranches(result.branches);
          setTotal(result.total);
          setTotalPages(result.total_pages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load branches.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBranches();

    return () => {
      cancelled = true;
    };
  }, [companyId, page, pageSize, search, refreshKey]);

  function openCreateModal() {
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEditModal(branch: Branch) {
    setEditingBranch(branch);

    setForm({
      name: branch.name,
      code: branch.code ?? "",
      description: branch.description ?? "",
      address: branch.address ?? "",
      city: branch.city ?? "",
      state: branch.state ?? "",
      country: branch.country,
      is_active: branch.is_active,
    });

    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) {
      setError("No company is currently selected.");
      return;
    }

    const activeCompanyId: number = companyId;

    const name = form.name.trim();

    if (!name) {
      setError("Branch name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name,
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || "India",
        is_active: form.is_active,
      };

      if (editingBranch) {
        await updateBranch(activeCompanyId, editingBranch.id, payload);
        setRefreshKey((current) => current + 1);
        showSuccess("Branch updated successfully.");
      } else {
        await createBranch(activeCompanyId, payload);
        setPage(1);
        setRefreshKey((current) => current + 1);
        showSuccess("Branch created successfully.");
      }
      setShowModal(false);
      setEditingBranch(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save branch.";

      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  function openStatusConfirmation(branch: Branch) {
    setStatusBranch(branch);
  }

  function closeStatusConfirmation() {
    if (saving) {
      return;
    }

    setStatusBranch(null);
  }

  async function handleConfirmBranchStatus() {
    if (companyId === null || statusBranch === null) {
      return;
    }

    const activeCompanyId = companyId;
    const branch = statusBranch;
    const nextStatus = !branch.is_active;

    try {
      setSaving(true);

      await updateBranch(activeCompanyId, branch.id, {
        name: branch.name,
        code: branch.code ?? null,
        description: branch.description ?? null,
        address: branch.address ?? null,
        city: branch.city ?? null,
        state: branch.state ?? null,
        country: branch.country,
        is_active: nextStatus,
      });

      setRefreshKey((current) => current + 1);

      showSuccess(
        nextStatus
          ? "Branch enabled successfully."
          : "Branch disabled successfully.",
      );

      setStatusBranch(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update branch status.";

      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleViewActivity(branch: Branch) {
    if (companyId === null) {
      return;
    }

    try {
      setAuditOpen(true);
      setAuditEntityName(branch.name);
      setAuditLogs([]);
      setAuditError(null);
      setAuditLoading(true);

      const logs = await getEntityAuditLogs(companyId, "BRANCH", branch.id);

      setAuditLogs(logs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load activity.";

      setAuditError(message);
    } finally {
      setAuditLoading(false);
    }
  }

  function handleCloseActivity() {
    setAuditOpen(false);
    setAuditLogs([]);
    setAuditError(null);
    setAuditEntityName("");
  }

  if (!currentCompany) {
    return (
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Select a company to manage branches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 p-5 sm:p-6 lg:p-7">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Branches
            </h1>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage the branches or locations belonging to this company.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] focus:ring-offset-2"
          >
            + Add Branch
          </button>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search branches..."
              aria-label="Search branches"
              className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            {total} {total === 1 ? "branch" : "branches"} found
          </p>
        </div>
        {/* Loading */}
        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Loading branches...
            </p>
          </div>
        ) : branches.length === 0 ? (
          /* Empty state */
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {search ? "No matching branches" : "No branches yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-secondary)]">
              {search
                ? "Try a different search term."
                : "Create your first branch to start organizing employees by location."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] focus:ring-offset-2"
              >
                Add Branch
              </button>
            )}
          </div>
        ) : (
          /* Branch table */
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {/* Only the table scrolls; the pagination footer stays outside this area. */}
            <div className="h-[clamp(220px,calc(100dvh-360px),760px)] overflow-x-auto overflow-y-auto overscroll-contain">
              <table className="w-full min-w-[760px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Branch
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Code
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Location
                    </th>

                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Status
                    </th>

                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {branches.map((branch) => (
                    <tr
                      key={branch.id}
                      className={`border-b border-[var(--border-muted)] last:border-b-0 transition-colors ${
                        branch.is_active
                          ? "hover:bg-[var(--surface-muted)]/40"
                          : "bg-slate-50/70 text-slate-500 hover:bg-slate-100/70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p
                          className={`text-sm font-medium ${
                            branch.is_active
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {branch.name}
                        </p>

                        {branch.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--text-secondary)]">
                            {branch.description}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {branch.code || "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {[branch.city, branch.state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            branch.is_active
                              ? "inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
                              : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                          }
                        >
                          {branch.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(branch)}
                            title="Edit branch"
                            aria-label={`Edit ${branch.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openStatusConfirmation(branch)}
                            disabled={saving}
                            title={
                              branch.is_active
                                ? "Disable branch"
                                : "Enable branch"
                            }
                            aria-label={
                              branch.is_active
                                ? `Disable ${branch.name}`
                                : `Enable ${branch.name}`
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Power size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleViewActivity(branch)}
                            title="View activity"
                            aria-label={`View activity for ${branch.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                          >
                            <Activity size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="relative z-10 flex min-w-0 shrink-0 flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2 text-sm text-[var(--text-secondary)]">
                <span>Rows per page</span>

                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text-primary)]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <span>
                  {total === 0
                    ? "0 results"
                    : `${(page - 1) * pageSize + 1}–${Math.min(
                        page * pageSize,
                        total,
                      )} of ${total}`}
                </span>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="min-h-9 shrink-0 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="whitespace-nowrap text-sm text-[var(--text-secondary)]">
                  Page {totalPages === 0 ? 0 : page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="min-h-9 shrink-0 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Branch modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Modal header */}
              <div className="border-b border-[var(--border)] px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3
                      id="branch-modal-title"
                      className="text-base font-semibold text-[var(--text-primary)]"
                    >
                      {editingBranch ? "Edit Branch" : "Add Branch"}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Add the basic details for this company branch.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal form */}
              <div className="grid gap-x-5 gap-y-4 px-6 py-5 sm:grid-cols-2">
                {/* Branch name */}
                <div>
                  <label
                    htmlFor="branch-name"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Branch Name *
                  </label>

                  <input
                    id="branch-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Ludhiana Branch"
                    className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* Branch code */}
                <div>
                  <label
                    htmlFor="branch-code"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Branch Code
                  </label>

                  <input
                    id="branch-code"
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="e.g. LUD"
                    className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="branch-description"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Description
                  </label>

                  <textarea
                    id="branch-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Optional description"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="branch-address"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Address
                  </label>

                  <textarea
                    id="branch-address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Branch address"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="branch-city"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    City
                  </label>

                  <input
                    id="branch-city"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    placeholder="e.g. Ludhiana"
                    className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* State */}
                <div>
                  <label
                    htmlFor="branch-state"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    State
                  </label>

                  <input
                    id="branch-state"
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    placeholder="e.g. Punjab"
                    className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                {/* Country */}
                <div>
                  <label
                    htmlFor="branch-country"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Country
                  </label>

                  <input
                    id="branch-country"
                    value={form.country}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        country: event.target.value,
                      }))
                    }
                    className="min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingBranch
                      ? "Save Changes"
                      : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <StatusConfirmModal
        open={statusBranch !== null}
        entityName={statusBranch?.name ?? ""}
        entityType="Branch"
        isActive={statusBranch?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmBranchStatus()}
        onClose={closeStatusConfirmation}
      />
      <AuditLogModal
        open={auditOpen}
        entityName={auditEntityName}
        logs={auditLogs}
        loading={auditLoading}
        error={auditError}
        onClose={handleCloseActivity}
      />
    </>
  );
}
