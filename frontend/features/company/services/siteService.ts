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
  latitude: number | null;
  longitude: number | null;
  geofence_radius: number | null;
  is_geofence_enabled: boolean;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SiteListResponse = {
  sites: Site[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type SiteListParams = {
  page?: number;
  page_size?: number;
  search?: string;
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
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius?: number | null;
  is_geofence_enabled?: boolean;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item: { msg?: string }) => item.msg ?? "")
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Keep the default error message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getSites(
  companyId: number,
  params: SiteListParams = {},
): Promise<SiteListResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 20),
  });

  const search = params.search?.trim();

  if (search) {
    query.set("search", search);
  }

  const response = await fetch(
    `${API_URL}/companies/${companyId}/sites?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<SiteListResponse>(response);
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
