"use client";

import { useEffect, useMemo, useState } from "react";

import { Activity, Pencil, Power } from "lucide-react";

import StatusConfirmModal from "@/components/feedback/StatusConfirmModal";

import { useSnackbar } from "@/components/feedback/SnackbarProvider";

import AuditLogModal from "./AuditLogModal";

import { getEntityAuditLogs, type AuditLog } from "../services/auditLogService";

import {
  createTeam,
  getTeams,
  updateTeam,
  type Team,
} from "../services/teamService";

import { getDepartments, type Department } from "../services/departmentService";

type TeamManagementProps = {
  companyId: number | null;
};

type TeamForm = {
  department_id: string;

  name: string;

  code: string;

  description: string;

  is_active: boolean;
};

const EMPTY_FORM: TeamForm = {
  department_id: "",

  name: "",

  code: "",

  description: "",

  is_active: true,
};

export default function TeamManagement({ companyId }: TeamManagementProps) {
  const { showSuccess, showError } = useSnackbar();

  const [teams, setTeams] = useState<Team[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [statusTeam, setStatusTeam] = useState<Team | null>(null);

  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [auditLoading, setAuditLoading] = useState(false);

  const [auditError, setAuditError] = useState<string | null>(null);

  const [auditOpen, setAuditOpen] = useState(false);

  const [auditEntityName, setAuditEntityName] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (companyId === null) {
      return;
    }

    const activeCompanyId = companyId;
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [teamsData, departmentsData] = await Promise.all([
          getTeams(activeCompanyId, {
            page,
            page_size: pageSize,
            search,
            ...(selectedDepartmentId
              ? { department_id: Number(selectedDepartmentId) }
              : {}),
          }),
          getDepartments(activeCompanyId, { page: 1, page_size: 100 }),
        ]);

        if (cancelled) return;

        setTeams(teamsData.teams);
        setTotal(teamsData.total);
        setTotalPages(teamsData.total_pages);
        setDepartments(departmentsData.departments);
      } catch (err) {
        if (cancelled) return;

        setError(err instanceof Error ? err.message : "Unable to load teams.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [companyId, page, pageSize, search, selectedDepartmentId, refreshKey]);

  const departmentMap = useMemo(() => {
    return new Map(
      departments.map((department) => [department.id, department.name]),
    );
  }, [departments]);

  function openCreateModal() {
    setEditingTeam(null);

    setForm({
      ...EMPTY_FORM,
      department_id: selectedDepartmentId,
    });

    setError(null);

    setShowModal(true);
  }

  function openEditModal(team: Team) {
    setEditingTeam(team);

    setForm({
      department_id: String(team.department_id),

      name: team.name,

      code: team.code ?? "",

      description: team.description ?? "",

      is_active: team.is_active,
    });

    setError(null);

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingTeam(null);

    setForm(EMPTY_FORM);

    setError(null);
  }

  function openStatusConfirmation(team: Team) {
    setStatusTeam(team);
  }

  function closeStatusConfirmation() {
    if (saving) {
      return;
    }

    setStatusTeam(null);
  }

  async function handleConfirmTeamStatus() {
    if (companyId === null || statusTeam === null) {
      return;
    }

    const team = statusTeam;

    const nextStatus = !team.is_active;

    try {
      setSaving(true);

      await updateTeam(companyId, team.id, {
        department_id: team.department_id,

        name: team.name,

        code: team.code ?? null,

        description: team.description ?? null,

        is_active: nextStatus,
      });

      setRefreshKey((current) => current + 1);

      setStatusTeam(null);

      showSuccess(
        nextStatus
          ? "Team enabled successfully."
          : "Team disabled successfully.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update team status.";

      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (companyId === null) {
      return;
    }

    const name = form.name.trim();

    const departmentId = Number(form.department_id);

    if (!departmentId || !Number.isInteger(departmentId)) {
      setError("Department is required.");

      return;
    }

    if (!name) {
      setError("Team name is required.");

      return;
    }

    try {
      setSaving(true);

      setError(null);

      const payload = {
        department_id: departmentId,

        name,

        code: form.code.trim() || null,

        description: form.description.trim() || null,

        is_active: form.is_active,
      };

      if (editingTeam) {
        await updateTeam(companyId, editingTeam.id, payload);
        setRefreshKey((current) => current + 1);

        showSuccess("Team updated successfully.");
      } else {
        await createTeam(companyId, payload);
        setSearchInput("");
        setSearch("");
        setPage(1);
        setRefreshKey((current) => current + 1);

        showSuccess("Team created successfully.");
      }

      setShowModal(false);
      setEditingTeam(null);
      setForm(EMPTY_FORM);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save team.";

      setError(message);

      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleViewActivity(team: Team) {
    if (companyId === null) {
      return;
    }

    try {
      setAuditOpen(true);

      setAuditEntityName(team.name);

      setAuditLogs([]);

      setAuditError(null);

      setAuditLoading(true);

      const logs = await getEntityAuditLogs(companyId, "TEAM", team.id);

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

  if (companyId === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Select a company to manage teams.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 sm:p-5">
        {/* Header */}

        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Teams</h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Manage teams within your company departments.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--brand-color)] px-3.5 text-xs font-medium text-white transition hover:opacity-90"
          >
            + Add Team
          </button>
        </div>

        {/* Search / Summary */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-2">
            <div>
              <label
                htmlFor="team-search"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                Search teams
              </label>
              <input
                id="team-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Team name, code, or description..."
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
              />
            </div>
            <div>
              <label
                htmlFor="team-department-filter"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                Department
              </label>
              <select
                id="team-department-filter"
                value={selectedDepartmentId}
                onChange={(event) => {
                  setSelectedDepartmentId(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="shrink-0 text-xs text-slate-500">
            {total} {total === 1 ? "team" : "teams"}
          </p>
        </div>

        {/* Error */}

        {error && !showModal && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        {/* Table */}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-slate-500">
              Loading teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-base text-slate-400">
                ▦
              </div>

              <h3 className="mt-3 text-sm font-medium text-slate-900">
                {searchInput.trim() || search || selectedDepartmentId
                  ? "No teams found"
                  : "No teams yet"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {search || selectedDepartmentId
                  ? "Try changing the search term or department filter."
                  : "Create your first team to get started."}
              </p>

              {!(searchInput.trim() || search || selectedDepartmentId) && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 text-xs font-medium text-[var(--brand-color)] hover:underline"
                >
                  Add team
                </button>
              )}
            </div>
          ) : (
            <div className="h-[clamp(220px,calc(100dvh-360px),760px)] overflow-x-auto overflow-y-auto overscroll-contain">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Team
                    </th>

                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {teams.map((team) => (
                    <tr
                      key={team.id}
                      className={`transition-colors ${
                        team.is_active
                          ? "hover:bg-slate-50/60"
                          : "bg-slate-50/70 text-slate-500 hover:bg-slate-100/70"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div
                          className={`text-sm font-medium ${
                            team.is_active ? "text-slate-900" : "text-slate-500"
                          }`}
                        >
                          {team.name}
                        </div>

                        {team.description && (
                          <div className="mt-0.5 max-w-xs truncate text-[11px] text-slate-500">
                            {team.description}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {departmentMap.get(team.department_id) || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {team.code || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            team.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {team.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(team)}
                            title="Edit team"
                            aria-label={`Edit ${team.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)]"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openStatusConfirmation(team)}
                            disabled={saving}
                            title={
                              team.is_active ? "Disable team" : "Enable team"
                            }
                            aria-label={
                              team.is_active
                                ? `Disable ${team.name}`
                                : `Enable ${team.name}`
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-[var(--brand-color)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Power size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleViewActivity(team)}
                            title="View activity"
                            aria-label={`View activity for ${team.name}`}
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
          )}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <label htmlFor="team-page-size">Rows per page</label>
              <select
                id="team-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[var(--brand-color)]"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span>
                {total === 0
                  ? "0 results"
                  : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="min-w-20 text-center text-xs text-slate-500">
                Page {totalPages === 0 ? 0 : page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || loading || totalPages === 0}
                className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Create / Edit Modal */}

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
          >
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3
                  id="team-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {editingTeam ? "Edit Team" : "Add Team"}
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  {editingTeam
                    ? "Update the team details."
                    : "Create a new team for this department."}
                </p>
              </div>

              <form onSubmit={handleSave}>
                <div className="space-y-4 px-5 py-5">
                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Department */}

                  <div>
                    <label
                      htmlFor="team-department"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Department
                    </label>

                    <select
                      id="team-department"
                      value={form.department_id}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,

                          department_id: event.target.value,
                        }))
                      }
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    >
                      <option value="">Select department</option>

                      {departments

                        .filter((department) => department.is_active)

                        .map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Team Name */}

                  <div>
                    <label
                      htmlFor="team-name"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Team Name
                    </label>

                    <input
                      id="team-name"
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,

                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Backend Team"
                      maxLength={150}
                      autoFocus
                      className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  {/* Code */}

                  <div>
                    <label
                      htmlFor="team-code"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Code
                    </label>

                    <input
                      id="team-code"
                      type="text"
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,

                          code: event.target.value,
                        }))
                      }
                      placeholder="e.g. BE"
                      maxLength={50}
                      className="h-9 w-full rounded-md border border-slate-200 px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>

                  {/* Description */}

                  <div>
                    <label
                      htmlFor="team-description"
                      className="mb-1 block text-xs font-medium text-slate-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="team-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,

                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Optional team description"
                      className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    />
                  </div>
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
                      : editingTeam
                        ? "Update Team"
                        : "Create Team"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <StatusConfirmModal
        open={statusTeam !== null}
        entityName={statusTeam?.name ?? ""}
        entityType="Team"
        isActive={statusTeam?.is_active ?? false}
        loading={saving}
        onConfirm={() => void handleConfirmTeamStatus()}
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
