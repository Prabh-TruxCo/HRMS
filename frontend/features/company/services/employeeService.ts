
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type Employee = {
  id: number;
  company_id: number;
  user_id: number | null;
  employee_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  personal_email: string | null;
  work_email: string | null;
  phone: string | null;
  alternate_phone?: string | null;
  department_id: number | null;
  designation_id: number | null;
  team_id: number | null;
  branch_id: number | null;
  site_id: number | null;
  employment_type_id: number | null;
  manager_id: number | null;
  joining_date: string | null;
  probation_end_date: string | null;
  confirmation_date: string | null;
  employment_end_date: string | null;
  employment_status: string;
  is_active: boolean;
  height_cm: number | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeePayload = {
  employee_code?: string | null;
  user_id?: number | null;
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  personal_email?: string | null;
  work_email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  department_id?: number | null;
  designation_id?: number | null;
  team_id?: number | null;
  branch_id?: number | null;
  site_id?: number | null;
  employment_type_id?: number | null;
  manager_id?: number | null;
  joining_date?: string | null;
  probation_end_date?: string | null;
  confirmation_date?: string | null;
  employment_end_date?: string | null;
  employment_status: string;
  is_active: boolean;
  height_cm?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
  custom_fields?: Record<string, unknown>;
};

export type EmployeeQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  department_id?: number;
  branch_id?: number;
  team_id?: number;
  employment_status?: string;
  is_active?: boolean;
};

export type PaginatedEmployeesResponse = {
  employees: Employee[];
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
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item: { msg?: string }) => item.msg ?? "Invalid input")
          .join(", ");
      }
    } catch {
      // Keep the default message if the response is not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getEmployees(
  companyId: number,
  params: EmployeeQueryParams = {},
): Promise<PaginatedEmployeesResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 20),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.department_id !== undefined) {
    query.set("department_id", String(params.department_id));
  }

  if (params.branch_id !== undefined) {
    query.set("branch_id", String(params.branch_id));
  }

  if (params.team_id !== undefined) {
    query.set("team_id", String(params.team_id));
  }

  if (params.employment_status) {
    query.set("employment_status", params.employment_status);
  }

  if (params.is_active !== undefined) {
    query.set("is_active", String(params.is_active));
  }

  const response = await fetch(
    `${API_URL}/companies/${companyId}/employees?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<PaginatedEmployeesResponse>(response);
}

export async function getEmployee(
  companyId: number,
  employeeId: number,
): Promise<Employee> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employees/${employeeId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return handleResponse<Employee>(response);
}

export async function createEmployee(
  companyId: number,
  payload: EmployeePayload,
): Promise<Employee> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employees`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Employee>(response);
}

export async function updateEmployee(
  companyId: number,
  employeeId: number,
  payload: EmployeePayload,
): Promise<Employee> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/employees/${employeeId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<Employee>(response);
}
