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
  const [search, setSearch] = useState("");

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
          getTeams(activeCompanyId),
          getDepartments(activeCompanyId),
        ]);

        if (cancelled) {
          return;
        }

        setTeams(teamsData);
        setDepartments(departmentsData);
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Unable to load teams.";

        setError(message);
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

  const departmentMap = useMemo(() => {
    return new Map(
      departments.map((department) => [department.id, department.name]),
    );
  }, [departments]);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return teams;
    }

    return teams.filter((team) => {
      const departmentName = departmentMap.get(team.department_id) ?? "";

      return (
        team.name.toLowerCase().includes(query) ||
        team.code?.toLowerCase().includes(query) ||
        team.description?.toLowerCase().includes(query) ||
        departmentName.toLowerCase().includes(query)
      );
    });
  }, [teams, search, departmentMap]);

  function openCreateModal() {
    setEditingTeam(null);
    setForm(EMPTY_FORM);
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

      const updated = await updateTeam(companyId, team.id, {
        department_id: team.department_id,
        name: team.name,
        code: team.code ?? null,
        description: team.description ?? null,
        is_active: nextStatus,
      });

      setTeams((current) =>
        current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

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
        const updated = await updateTeam(companyId, editingTeam.id, payload);

        setTeams((current) =>
          current
            .map((team) => (team.id === updated.id ? updated : team))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );

        showSuccess("Team updated successfully.");
      } else {
        const created = await createTeam(companyId, payload);

        setTeams((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );

        showSuccess("Team created successfully.");
      }

      closeModal();
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
            />
          </div>

          <p className="text-xs text-slate-500">
            {filteredTeams.length}{" "}
            {filteredTeams.length === 1 ? "team" : "teams"}
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
          ) : filteredTeams.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-base text-slate-400">
                ▦
              </div>

              <h3 className="mt-3 text-sm font-medium text-slate-900">
                {search ? "No teams found" : "No teams yet"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? "Try a different search term."
                  : "Create your first team to get started."}
              </p>

              {!search && (
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/70">
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
                  {filteredTeams.map((team) => (
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
