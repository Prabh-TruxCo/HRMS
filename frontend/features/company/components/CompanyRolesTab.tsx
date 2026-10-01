"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createRole,
  deleteRole,
  getCompanyRoles,
  getPermissions,
  getRole,
  updateRole,
  updateRolePermissions,
  type Permission,
  type Role,
  type RoleDetail,
} from "../services/roleService";

import { useCompany } from "../context/CompanyContext";

type PermissionState = Record<string, boolean>;

type RoleFormState = {
  name: string;
  description: string;
  is_active: boolean;
};

const EMPTY_ROLE_FORM: RoleFormState = {
  name: "",
  description: "",
  is_active: true,
};

export default function CompanyRolesTab() {
  const { currentCompany } = useCompany();

  const companyId = currentCompany?.id ?? null;

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);

  const [permissionState, setPermissionState] = useState<PermissionState>({});

  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [deletingRole, setDeletingRole] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [roleForm, setRoleForm] = useState<RoleFormState>(EMPTY_ROLE_FORM);

  /*
   * Load roles + permission catalog whenever the selected company changes.
   *
   * Important:
   * We do not synchronously reset state inside the effect.
   * This avoids react-hooks/set-state-in-effect warnings.
   */
  useEffect(() => {
    if (!companyId) {
      return;
    }

    const targetCompanyId: number = companyId;
    let cancelled = false;

    async function loadCompanyData() {
      try {
        setLoading(true);
        setLoadingPermissions(true);
        setError(null);

        const [permissionResult, roleResult] = await Promise.all([
          getPermissions(),
          getCompanyRoles(targetCompanyId),
        ]);

        if (cancelled) {
          return;
        }

        setPermissions(permissionResult);
        setLoadingPermissions(false);
        setRoles(roleResult);

        if (roleResult.length === 0) {
          setSelectedRole(null);
          return;
        }

        const firstRole = await getRole(targetCompanyId, roleResult[0].id);

        if (cancelled) {
          return;
        }

        setSelectedRole(firstRole);
        setPermissionState(buildPermissionState(permissionResult, firstRole));
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load roles and permissions.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingPermissions(false);
        }
      }
    }

    void loadCompanyData();

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  /*
   * Build permission checkbox state.
   *
   * Every permission starts as false.
   * Existing role permissions are then marked true.
   */
  function buildPermissionState(
    permissionList: Permission[],
    role: RoleDetail,
  ): PermissionState {
    const nextState: PermissionState = {};

    for (const permission of permissionList) {
      nextState[permission.code] = false;
    }

    for (const permission of role.permissions) {
      nextState[permission.permission_code] = true;
    }

    return nextState;
  }

  /*
   * Load a specific role.
   */
  async function loadRole(targetCompanyId: number, roleId: number) {
    try {
      setLoadingRole(true);
      setError(null);

      const result = await getRole(targetCompanyId, roleId);

      setSelectedRole(result);
      setPermissionState(buildPermissionState(permissions, result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load role.");
    } finally {
      setLoadingRole(false);
    }
  }

  /*
   * Group permissions by module.
   */
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};

    for (const permission of permissions) {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }

      grouped[permission.module].push(permission);
    }

    return grouped;
  }, [permissions]);

  const selectedPermissionCount = useMemo(() => {
    return Object.values(permissionState).filter(Boolean).length;
  }, [permissionState]);

  /*
   * System roles are read-only.
   */
  const isSystemRole = selectedRole?.is_system_role ?? false;

  /*
   * Open create role modal.
   */
  function handleCreateRole() {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setError(null);
    setShowRoleModal(true);
  }

  /*
   * Open edit role modal.
   */
  function handleEditRole(role: Role) {
    if (role.is_system_role) {
      return;
    }

    setEditingRole(role);

    setRoleForm({
      name: role.name,
      description: role.description ?? "",
      is_active: role.is_active,
    });

    setError(null);
    setShowRoleModal(true);
  }

  /*
   * Save role information.
   */
  async function handleSaveRole(event: React.FormEvent) {
    event.preventDefault();

    if (!companyId) {
      return;
    }

    const name = roleForm.name.trim();

    if (!name) {
      setError("Role name is required.");
      return;
    }

    try {
      setSavingRole(true);
      setError(null);

      if (editingRole) {
        await updateRole(companyId, editingRole.id, {
          name,
          description: roleForm.description.trim() || null,
          is_active: roleForm.is_active,
        });
      } else {
        await createRole(companyId, {
          name,
          description: roleForm.description.trim() || null,
          is_active: roleForm.is_active,
        });
      }

      const updatedRoles = await getCompanyRoles(companyId);

      setRoles(updatedRoles);
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm(EMPTY_ROLE_FORM);

      /*
       * If this was a new role, select it.
       * If editing an existing role, reload it.
       */
      if (editingRole) {
        await loadRole(companyId, editingRole.id);
      } else {
        const createdRole =
          updatedRoles.find((role) => role.name === name) ??
          updatedRoles[updatedRoles.length - 1];

        if (createdRole) {
          await loadRole(companyId, createdRole.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save role.");
    } finally {
      setSavingRole(false);
    }
  }

  /*
   * Delete custom role.
   */
  async function handleDeleteRole(role: Role) {
    if (!companyId || role.is_system_role) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${role.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRole(true);
      setError(null);

      await deleteRole(companyId, role.id);

      const updatedRoles = await getCompanyRoles(companyId);

      setRoles(updatedRoles);

      if (updatedRoles.length === 0) {
        setSelectedRole(null);
        setPermissionState({});
        return;
      }

      const nextRole =
        updatedRoles.find((item) => item.id !== role.id) ?? updatedRoles[0];

      await loadRole(companyId, nextRole.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete role.");
    } finally {
      setDeletingRole(false);
    }
  }

  /*
   * Toggle one permission.
   */
  function handlePermissionToggle(permissionCode: string) {
    if (isSystemRole) {
      return;
    }

    setPermissionState((current) => ({
      ...current,
      [permissionCode]: !current[permissionCode],
    }));
  }

  /*
   * Select or clear every permission in a module.
   */
  function handleModuleToggle(module: string, enabled: boolean) {
    if (isSystemRole) {
      return;
    }

    const modulePermissions = permissionsByModule[module] ?? [];

    setPermissionState((current) => {
      const next = { ...current };

      for (const permission of modulePermissions) {
        next[permission.code] = enabled;
      }

      return next;
    });
  }

  /*
   * Check whether all permissions in a module
   * are currently selected.
   */
  function isModuleFullySelected(module: string) {
    const modulePermissions = permissionsByModule[module] ?? [];

    if (modulePermissions.length === 0) {
      return false;
    }

    return modulePermissions.every(
      (permission) => permissionState[permission.code] === true,
    );
  }

  /*
   * Save custom role permissions.
   *
   * Scope is intentionally NOT selected here.
   * The role defines WHAT the user can do.
   * Scope is configured when the role is assigned
   * to an employee.
   */
  async function handleSavePermissions() {
    if (!companyId || !selectedRole) {
      return;
    }

    if (selectedRole.is_system_role) {
      return;
    }

    try {
      setSavingPermissions(true);
      setError(null);

      const selectedPermissions = permissions
        .filter((permission) => permissionState[permission.code] === true)
        .map((permission) => ({
          permission_code: permission.code,
          /*
           * Role editor does not choose scope.
           * COMPANY is used as the role-level default.
           *
           * Actual employee-level scope will be configured
           * when this role is assigned to a membership.
           */
          scope: "COMPANY" as const,
        }));

      await updateRolePermissions(
        companyId,
        selectedRole.id,
        selectedPermissions,
      );

      const refreshedRole = await getRole(companyId, selectedRole.id);

      setSelectedRole(refreshedRole);
      setPermissionState(buildPermissionState(permissions, refreshedRole));

      /*
       * Refresh role list because permission count
       * may have changed.
       */
      const updatedRoles = await getCompanyRoles(companyId);

      setRoles(updatedRoles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save permissions.",
      );
    } finally {
      setSavingPermissions(false);
    }
  }

  /*
   * No company selected.
   */
  if (!currentCompany) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Select a company to manage roles and permissions.
        </p>
      </div>
    );
  }

  /*
   * Initial loading.
   */
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand-color)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Loading roles and permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Roles & Permissions
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
              Define what each role can do in your company. Access scope is
              configured when the role is assigned to an employee.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateRole}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] focus:ring-offset-2"
          >
            + Create Role
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Role list */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Roles
              </h3>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {roles.length} {roles.length === 1 ? "role" : "roles"}
              </p>
            </div>

            <div className="p-2">
              {roles.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    No roles found.
                  </p>

                  <button
                    type="button"
                    onClick={handleCreateRole}
                    className="mt-3 text-sm font-medium text-[var(--brand-color)] hover:underline"
                  >
                    Create your first role
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {roles.map((role) => {
                    const selected = selectedRole?.id === role.id;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          if (!companyId) {
                            return;
                          }

                          void loadRole(companyId, role.id);
                        }}
                        className={[
                          "w-full rounded-lg px-3 py-3 text-left transition",
                          selected
                            ? "bg-[var(--brand-color-soft)] text-[var(--text-primary)]"
                            : "hover:bg-[var(--surface-muted)]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {role.name}
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-secondary)]">
                              {role.permissions_count} permissions
                            </p>
                          </div>

                          {role.is_system_role && (
                            <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                              System
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Role detail */}
          <div className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {!selectedRole ? (
              <div className="flex min-h-80 items-center justify-center p-6 text-center">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    No role selected
                  </h3>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Select a role from the list to manage its permissions.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Role header */}
                <div className="border-b border-[var(--border)] px-5 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                          {selectedRole.name}
                        </h3>

                        {selectedRole.is_system_role && (
                          <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                            System role
                          </span>
                        )}
                      </div>

                      {selectedRole.description && (
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {selectedRole.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        {selectedPermissionCount} selected permissions
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!selectedRole.is_system_role && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const role = roles.find(
                                (item) => item.id === selectedRole.id,
                              );

                              if (role) {
                                handleEditRole(role);
                              }
                            }}
                            className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                          >
                            Edit Role
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const role = roles.find(
                                (item) => item.id === selectedRole.id,
                              );

                              if (role) {
                                void handleDeleteRole(role);
                              }
                            }}
                            disabled={deletingRole}
                            className="min-h-10 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingRole ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="p-5">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        Permissions
                      </h4>

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Select the actions this role can perform.
                      </p>
                    </div>

                    {!selectedRole.is_system_role && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleSavePermissions();
                        }}
                        disabled={savingPermissions || loadingPermissions}
                        className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingPermissions ? "Saving..." : "Save Permissions"}
                      </button>
                    )}
                  </div>

                  {loadingRole || loadingPermissions ? (
                    <div className="flex min-h-48 items-center justify-center">
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand-color)]" />

                        <p className="text-sm text-[var(--text-secondary)]">
                          Loading permissions...
                        </p>
                      </div>
                    </div>
                  ) : permissions.length === 0 ? (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-5 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">
                        No permissions are available.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {Object.entries(permissionsByModule).map(
                        ([module, modulePermissions]) => {
                          const allSelected = isModuleFullySelected(module);

                          return (
                            <div
                              key={module}
                              className="overflow-hidden rounded-xl border border-[var(--border)]"
                            >
                              {/* Module header */}
                              <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h5 className="text-sm font-semibold capitalize text-[var(--text-primary)]">
                                    {module}
                                  </h5>

                                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                    {modulePermissions.length} permissions
                                  </p>
                                </div>

                                {!selectedRole.is_system_role && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleModuleToggle(module, !allSelected)
                                    }
                                    className="self-start text-xs font-medium text-[var(--brand-color)] hover:underline sm:self-auto"
                                  >
                                    {allSelected ? "Clear all" : "Select all"}
                                  </button>
                                )}
                              </div>

                              {/* Permission rows */}
                              <div className="divide-y divide-[var(--border-muted)]">
                                {modulePermissions.map((permission) => {
                                  const checked =
                                    permissionState[permission.code] === true;

                                  return (
                                    <label
                                      key={permission.code}
                                      className={[
                                        "flex items-start gap-3 px-4 py-3",
                                        selectedRole.is_system_role
                                          ? "cursor-default"
                                          : "cursor-pointer hover:bg-[var(--surface-muted)]",
                                      ].join(" ")}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={selectedRole.is_system_role}
                                        onChange={() =>
                                          handlePermissionToggle(
                                            permission.code,
                                          )
                                        }
                                        className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--brand-color)] focus:ring-[var(--brand-color)]"
                                      />

                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)]">
                                          {permission.name}
                                        </p>

                                        {permission.description && (
                                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                                            {permission.description}
                                          </p>
                                        )}

                                        <p className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                                          {permission.code}
                                        </p>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}

                  {selectedRole.is_system_role && (
                    <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        System role permissions cannot be modified.
                      </p>

                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Create a custom role if you need a different permission
                        combination.
                      </p>
                    </div>
                  )}

                  {!selectedRole.is_system_role && (
                    <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                      <p className="text-xs leading-5 text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">
                          About access scope:
                        </strong>{" "}
                        this screen defines what the role can do. When the role
                        is assigned to an employee, you can configure whether
                        the access applies to the company, branch, department,
                        team, assigned site, or the employee themselves.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Role Modal */}
      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-[var(--surface)] shadow-xl">
            <form onSubmit={handleSaveRole}>
              {/* Modal header */}
              <div className="border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      id="role-modal-title"
                      className="text-base font-semibold text-[var(--text-primary)]"
                    >
                      {editingRole ? "Edit Role" : "Create Role"}
                    </h3>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Define the role name and basic information.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="space-y-5 px-5 py-5">
                <div>
                  <label
                    htmlFor="role-name"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Role Name
                  </label>

                  <input
                    id="role-name"
                    type="text"
                    value={roleForm.name}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Site Supervisor"
                    className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="role-description"
                    className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Description
                  </label>

                  <textarea
                    id="role-description"
                    value={roleForm.description}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe the responsibility of this role"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color-soft)]"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={roleForm.is_active}
                    onChange={(event) =>
                      setRoleForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--brand-color)] focus:ring-[var(--brand-color)]"
                  />

                  <span>
                    <span className="block text-sm font-medium text-[var(--text-primary)]">
                      Active
                    </span>

                    <span className="block text-xs text-[var(--text-secondary)]">
                      Allow this role to be assigned to employees.
                    </span>
                  </span>
                </label>
              </div>

              {/* Modal footer */}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="min-h-10 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingRole}
                  className="min-h-10 rounded-lg bg-[var(--brand-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingRole
                    ? "Saving..."
                    : editingRole
                      ? "Save Changes"
                      : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
