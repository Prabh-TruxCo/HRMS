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

type BranchListResponse = {
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

export async function getBranches(
  companyId: number,
): Promise<Branch[]> {
  const response = await fetch(
    `${API_URL}/companies/${companyId}/branches`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const result =
    (await parseResponse(
      response,
    )) as BranchListResponse;

  return result.branches;
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