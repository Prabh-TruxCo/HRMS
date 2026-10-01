export type RolePermission = {
  id: number;
  permission_id: number;
  permission_code: string;
  permission_name: string;
  module: string;
  scope: string;
};

export type Role = {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  permissions_count: number;
  is_system_role: boolean;
};

export type RoleDetail = {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_system_role: boolean;
  permissions: RolePermission[];
};

export type CreateRoleRequest = {
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type UpdateRoleRequest = {
  name: string;
  description?: string | null;
  is_active: boolean;
};

export type RolePermissionRequest = {
  permission_code: string;
  scope:
    | "COMPANY"
    | "BRANCH"
    | "DEPARTMENT"
    | "TEAM"
    | "ASSIGNED_SITE"
    | "SELF";
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function parseResponse(response: Response) {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof result?.detail === "string"
        ? result.detail
        : "Unable to complete the request.",
    );
  }

  return result;
}

export async function getCompanyRoles(
  companyId: number,
): Promise<Role[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/roles`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const result = await parseResponse(response);

  return result.roles;
}

export async function getRole(
  companyId: number,
  roleId: number,
): Promise<RoleDetail> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/roles/${roleId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return parseResponse(response);
}

export async function createRole(
  companyId: number,
  data: CreateRoleRequest,
): Promise<RoleDetail> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/roles`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(response);
}

export async function updateRole(
  companyId: number,
  roleId: number,
  data: UpdateRoleRequest,
): Promise<RoleDetail> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/roles/${roleId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return parseResponse(response);
}

export async function updateRolePermissions(
  companyId: number,
  roleId: number,
  permissions: RolePermissionRequest[],
): Promise<RoleDetail> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/roles/${roleId}/permissions`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        permissions,
      }),
    },
  );

  return parseResponse(response);
}

export async function deleteRole(
  companyId: number,
  roleId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/roles/${roleId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await parseResponse(response);
}

export type Permission = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  module: string;
};

export async function getPermissions(): Promise<Permission[]> {
  const response = await fetch(
    `${API_URL}/permissions`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const result = await parseResponse(response);

  return result.permissions;
}