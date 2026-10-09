const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Site = {
  id: number;
  company_id: number;
  client_id: number;
  name: string;
  code: string | null;
  site_type: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SiteListResponse = {
  sites: Site[];
};

export type SitePayload = {
  client_id: number;
  name: string;
  code?: string | null;
  site_type?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postal_code?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
};

async function handleResponse<T>(response: Response): Promise<T> {
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

export async function getSites(companyId: number): Promise<Site[]> {
  const response = await fetch(`${API_URL}/companies/${companyId}/sites`, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleResponse<SiteListResponse>(response);

  return data.sites;
}

export async function getSite(
  companyId: number,
  siteId: number,
): Promise<Site> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/sites/${siteId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Site>(response);
}

export async function createSite(
  companyId: number,
  payload: SitePayload,
): Promise<Site> {
  const response = await fetch(`${API_URL}/companies/${companyId}/sites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<Site>(response);
}

export async function updateSite(
  companyId: number,
  siteId: number,
  payload: SitePayload,
): Promise<Site> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/sites/${siteId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Site>(response);
}
