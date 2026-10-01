export type ScopeCode =
  | "COMPANY"
  | "BRANCH"
  | "DEPARTMENT"
  | "TEAM"
  | "ASSIGNED_SITE"
  | "SELF";

export type RoleScopeAssignment = {
  scope: ScopeCode;
  scope_entity_ids: number[];
};

export type MemberRole = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type MemberRoleAssignment = {
  role: MemberRole;
  scope_assignments: RoleScopeAssignment[];
};

export type MemberRolesResponse = {
  membership_id: number;
  user_id: number;
  company_id: number;
  roles: MemberRoleAssignment[];
};

export type MemberRoleAssignmentRequest = {
  role_id: number;
  scope_assignments: RoleScopeAssignment[];
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

export async function getMemberRoles(
  companyId: number,
  membershipId: number,
): Promise<MemberRolesResponse> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/members/${membershipId}/roles`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return parseResponse(response);
}

export async function updateMemberRoles(
  companyId: number,
  membershipId: number,
  roles: MemberRoleAssignmentRequest[],
): Promise<MemberRolesResponse> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/members/${membershipId}/roles`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roles,
      }),
    },
  );

  return parseResponse(response);
}