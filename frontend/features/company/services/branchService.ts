const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api";

export type Branch = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateBranchRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  is_active?: boolean;
};

export type UpdateBranchRequest = {
  name: string;
  code?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  is_active: boolean;
};

export type BranchPagination = {
total: number;
page: number;
page_size: number;
total_pages: number;
};

export type PaginatedBranchesResponse =
BranchPagination & {
branches: Branch[];
};


async function parseResponse(
  response: Response,
) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ??
        "Something went wrong. Please try again.",
    );
  }

  return data;
}


export type BranchQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export async function getBranches(
  companyId: number,
  params: BranchQueryParams = {},
): Promise<PaginatedBranchesResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    page_size: String(params.page_size ?? 20),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const response = await fetch(
    `${API_URL}/companies/${companyId}/branches?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return (await parseResponse(
    response,
  )) as PaginatedBranchesResponse;
}

export async function getBranch(
  companyId: number,
  branchId: number,
): Promise<Branch> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/branches/${branchId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return (await parseResponse(
    response,
  )) as Branch;
}

export async function createBranch(
  companyId: number,
  data: CreateBranchRequest,
): Promise<Branch> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/branches`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(
    response,
  )) as Branch;
}

export async function updateBranch(
  companyId: number,
  branchId: number,
  data: UpdateBranchRequest,
): Promise<Branch> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/branches/${branchId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  return (await parseResponse(
    response,
  )) as Branch;
}

export async function deleteBranch(
  companyId: number,
  branchId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/branches/${branchId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await parseResponse(response);
}