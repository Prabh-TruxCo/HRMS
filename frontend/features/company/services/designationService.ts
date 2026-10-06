const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api";

export type Designation = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
};

export type DesignationPayload = {
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
};

async function handleResponse<T>(
  response: Response,
): Promise<T> {
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


export async function getDesignations(
  companyId: number,
): Promise<Designation[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/designations`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Designation[]>(response);
}


export async function getDesignation(
  companyId: number,
  designationId: number,
): Promise<Designation> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/designations/${designationId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Designation>(response);
}


export async function createDesignation(
  companyId: number,
  payload: DesignationPayload,
): Promise<Designation> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/designations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Designation>(response);
}


export async function updateDesignation(
  companyId: number,
  designationId: number,
  payload: DesignationPayload,
): Promise<Designation> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/designations/${designationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Designation>(response);
}


export async function updateDesignationStatus(
  companyId: number,
  designationId: number,
  isActive: boolean,
): Promise<Designation> {
  const params = new URLSearchParams({
    is_active: String(isActive),
  });

  const response = await fetch(
    `${API_URL}/companies/${companyId}/designations/${designationId}/status?${params.toString()}`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  return handleResponse<Designation>(response);
}