const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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
  departmentId?: number,
): Promise<Team[]> {
  const params = new URLSearchParams();

  if (departmentId !== undefined) {
    params.set("department_id", String(departmentId));
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/companies/${companyId}/teams${query ? `?${query}` : ""}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Team[]>(response);
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
  const response = await fetch(
    `${API_URL}/companies/${companyId}/teams`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    },
  );

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