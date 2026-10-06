const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export type EmploymentType = {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type EmploymentTypeCreateRequest = {
  name: string;
  description?: string | null;
};

export type EmploymentTypeUpdateRequest = {
  name: string;
  description?: string | null;
  is_active: boolean;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function getEmploymentTypes(
  companyId: number,
): Promise<EmploymentType[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employment-types`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<EmploymentType[]>(response);
}

export async function createEmploymentType(
  companyId: number,
  data: EmploymentTypeCreateRequest,
): Promise<EmploymentType> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employment-types`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return handleResponse<EmploymentType>(response);
}

export async function updateEmploymentType(
  companyId: number,
  employmentTypeId: number,
  data: EmploymentTypeUpdateRequest,
): Promise<EmploymentType> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employment-types/${employmentTypeId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return handleResponse<EmploymentType>(response);
}

export async function deleteEmploymentType(
  companyId: number,
  employmentTypeId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employment-types/${employmentTypeId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  return handleResponse<void>(response);
}