const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export type CompanyDetail = {
  id: number;
  account_id: number;
  name: string;
  legal_name: string | null;
  code: string;
  industry_codes: string[];
  employee_size: string | null;
  country: string;
  timezone: string;
  color: string | null;
  logo: string | null;
  is_active: boolean;
};

export type UpdateCompanyRequest = {
  name: string;
  legal_name: string | null;
  industry_codes: string[];
  employee_size: string | null;
  country: string;
  timezone: string;
  color: string | null;
  logo: string | null;
};

export async function getCompany(companyId: number): Promise<CompanyDetail> {
  const response = await fetch(`${API_URL}/companies/${companyId}`, {
    method: "GET",
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to load company.",
    );
  }

  return result;
}

export async function updateCompany(
  companyId: number,
  data: UpdateCompanyRequest,
): Promise<CompanyDetail> {
  const response = await fetch(`${API_URL}/companies/${companyId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to update company.",
    );
  }

  return result;
}
