export type CreateCompanyRequest = {
  name: string;
  industry_type: string;
  employee_size: string | null;
  country: string;
};

export type CompanyResponse = {
  id: number;
  account_id: number;
  name: string;
  code: string;
  industry_type: string;
  employee_size: string | null;
  country: string;
  color: string | null;
  logo: string | null;
  is_active: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function createCompanies(
  companies: CreateCompanyRequest[],
): Promise<CompanyResponse[]> {
  const response = await fetch(`${API_URL}/companies/bulk`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companies,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to create companies.",
    );
  }

  return result.companies;
}

export async function getMyCompanies(): Promise<CompanyResponse[]> {
  const response = await fetch(`${API_URL}/companies/mine`, {
    method: "GET",
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to load companies.",
    );
  }

  return result.companies;
}
