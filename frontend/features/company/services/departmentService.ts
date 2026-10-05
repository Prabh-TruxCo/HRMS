const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Department = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentCreateRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
  is_active: boolean;
};

export type DepartmentUpdateRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
  is_active: boolean;
};

type DepartmentListResponse = {
  departments: Department[];
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Keep default message if response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getDepartments(companyId: number): Promise<Department[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/departments`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await handleResponse<DepartmentListResponse>(response);

  return data.departments;
}

export async function getDepartment(
  companyId: number,
  departmentId: number,
): Promise<Department> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/departments/${departmentId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Department>(response);
}

export async function createDepartment(
  companyId: number,
  payload: DepartmentCreateRequest,
): Promise<Department> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/departments`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Department>(response);
}

export async function updateDepartment(
  companyId: number,
  departmentId: number,
  payload: DepartmentUpdateRequest,
): Promise<Department> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/departments/${departmentId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Department>(response);
}

export async function deleteDepartment(
  companyId: number,
  departmentId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/departments/${departmentId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await handleResponse<void>(response);
}
