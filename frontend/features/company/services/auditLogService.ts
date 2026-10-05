export type AuditChangeType = "added" | "removed" | "updated";

export type AuditChange = {
  path: string;
  field: string;
  type: AuditChangeType;
  oldValue?: unknown;
  newValue?: unknown;
};

export type AuditLog = {
  id: number;

  account_id: number | null;
  company_id: number | null;
  user_id: number | null;

  user_name: string | null;

  module: string;
  entity_type: string;
  entity_id: number;
  action: string;

  description: string | null;

  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;

  created_at: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getCompanyAuditLogs(
  companyId: number,
): Promise<AuditLog[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/audit-logs`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<AuditLog[]>(response);
}

export async function getEntityAuditLogs(
  companyId: number,
  entityType: string,
  entityId: number,
): Promise<AuditLog[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/audit-logs/${encodeURIComponent(
      entityType,
    )}/${entityId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<AuditLog[]>(response);
}

export async function getCompanyEntityAuditLogs(
  companyId: number,
  entityType: string,
): Promise<AuditLog[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/audit-logs/${encodeURIComponent(
      entityType,
    )}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<AuditLog[]>(response);
}