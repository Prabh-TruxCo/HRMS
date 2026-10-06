const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Client = {
  id: number;
  name: string;
  code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  description: string | null;
  is_active: boolean;
};

export type ClientPayload = {
  name: string;
  code?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
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
    } catch {}

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getClients(
  companyId: number,
): Promise<Client[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/clients`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Client[]>(response);
}

export async function getClient(
  companyId: number,
  clientId: number,
): Promise<Client> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/clients/${clientId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Client>(response);
}

export async function createClient(
  companyId: number,
  payload: ClientPayload,
): Promise<Client> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/clients`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Client>(response);
}

export async function updateClient(
  companyId: number,
  clientId: number,
  payload: ClientPayload,
): Promise<Client> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/clients/${clientId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Client>(response);
}

export async function updateClientStatus(
  companyId: number,
  clientId: number,
  isActive: boolean,
): Promise<Client> {
  const params = new URLSearchParams({
    is_active: String(isActive),
  });

  const response = await fetch(
    `${API_URL}/companies/${companyId}/clients/${clientId}/status?${params.toString()}`,
    {
      method: "PATCH",
      credentials: "include",
    },
  );

  return handleResponse<Client>(response);
}