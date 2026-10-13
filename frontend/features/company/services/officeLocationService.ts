
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api";

export type OfficeLocation = {
  id: number;
  company_id: number;
  branch_id: number;
  name: string;
  code: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_enabled: boolean;
  geofence_radius_meters: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OfficeLocationFormData = {
  name: string;
  code?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence_enabled?: boolean;
  geofence_radius_meters?: number | null;
  is_active: boolean;
};

export type OfficeLocationQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export type PaginatedOfficeLocationsResponse = {
  locations: OfficeLocation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ?? "Something went wrong. Please try again.",
    );
  }

  return data;
}

function locationsUrl(companyId: number, branchId: number) {
  return (
    `${API_URL}/companies/${companyId}` +
    `/branches/${branchId}/locations`
  );
}

export async function getOfficeLocations(
  companyId: number,
  branchId: number,
  params: OfficeLocationQueryParams = {},
): Promise<PaginatedOfficeLocationsResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 20),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const response = await fetch(
    `${locationsUrl(companyId, branchId)}?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return (await parseResponse(
    response,
  )) as PaginatedOfficeLocationsResponse;
}

export async function getOfficeLocation(
  companyId: number,
  branchId: number,
  locationId: number,
): Promise<OfficeLocation> {
  const response = await fetch(
    `${locationsUrl(companyId, branchId)}/${locationId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return (await parseResponse(response)) as OfficeLocation;
}

export async function createOfficeLocation(
  companyId: number,
  branchId: number,
  data: OfficeLocationFormData,
): Promise<OfficeLocation> {
  const response = await fetch(
    locationsUrl(companyId, branchId),
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(response)) as OfficeLocation;
}

export async function updateOfficeLocation(
  companyId: number,
  branchId: number,
  locationId: number,
  data: OfficeLocationFormData,
): Promise<OfficeLocation> {
  const response = await fetch(
    `${locationsUrl(companyId, branchId)}/${locationId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(response)) as OfficeLocation;
}
