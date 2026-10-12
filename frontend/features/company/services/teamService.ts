const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Team = {
  id: number;
  department_id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
};

export type TeamPayload = {
  department_id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active: boolean;
};

export type TeamQueryParams = {
  department_id?: number;
  page?: number;
  page_size?: number;
  search?: string;
};

export type PaginatedTeamsResponse = {
  teams: Team[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getTeams(
  companyId: number,
  params: TeamQueryParams = {},
): Promise<PaginatedTeamsResponse> {
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(params.page ?? 1));
  queryParams.set("page_size", String(params.page_size ?? 10));

  if (params.department_id !== undefined) {
    queryParams.set("department_id", String(params.department_id));
  }

  const search = params.search?.trim();
  if (search) {
    queryParams.set("search", search);
  }

  const response = await fetch(
    `${API_URL}/companies/${companyId}/teams?${queryParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<PaginatedTeamsResponse>(response);
}

export async function getTeam(
  companyId: number,
  teamId: number,
): Promise<Team> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/teams/${teamId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Team>(response);
}

export async function createTeam(
  companyId: number,
  payload: TeamPayload,
): Promise<Team> {
  const response = await fetch(`${API_URL}/companies/${companyId}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<Team>(response);
}

export async function updateTeam(
  companyId: number,
  teamId: number,
  payload: TeamPayload,
): Promise<Team> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/teams/${teamId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Team>(response);
}
