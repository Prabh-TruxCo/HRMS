const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api";

export type Shift = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  is_active: boolean;
};

export type CreateShiftRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  is_active?: boolean;
};

export type UpdateShiftRequest = CreateShiftRequest;

export type BulkShiftCreateRequest = {
  name_prefix: string;
  first_start_time: string;
  last_start_time: string;
  interval_minutes: number;
  duration_minutes: number;
  break_duration_minutes: number;
  is_active: boolean;
};

export type BulkShiftCreateResponse = {
  created_count: number;
  shifts: Shift[];
};


export type ShiftQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
};

export type PaginatedShiftsResponse = {
  shifts: Shift[];
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

export async function getShifts(
  companyId: number,
  params: ShiftQueryParams = {},
): Promise<PaginatedShiftsResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 20),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.is_active !== undefined) {
    query.set("is_active", String(params.is_active));
  }

  const response = await fetch(
    `${API_URL}/companies/${companyId}/shifts?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return (await parseResponse(response)) as PaginatedShiftsResponse;
}

export async function getShift(
  companyId: number,
  shiftId: number,
): Promise<Shift> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/shifts/${shiftId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return (await parseResponse(response)) as Shift;
}

export async function createShift(
  companyId: number,
  data: CreateShiftRequest,
): Promise<Shift> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/shifts`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(response)) as Shift;
}

export async function updateShift(
  companyId: number,
  shiftId: number,
  data: UpdateShiftRequest,
): Promise<Shift> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/shifts/${shiftId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(response)) as Shift;
}


export async function createShiftsBulk(
  companyId: number,
  data: BulkShiftCreateRequest,
): Promise<BulkShiftCreateResponse> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/shifts/bulk`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(response)) as BulkShiftCreateResponse;
}
