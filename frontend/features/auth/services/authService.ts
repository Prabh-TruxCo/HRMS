export type RegisterRequest = {
  first_name: string;
  last_name: string | null;
  email: string;
  password: string;

  account_name: string;

  company_name: string;
  company_code: string;
  industry_codes: string[];
  employee_size: string | null;
  country: string;

  logo: File | null;
  color: string | null;
};

export type RegisterResponse = {
  message: string;
  user_id: number;
  account_id: number;
  company_id: number;
  access_token: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string | null;
    is_platform_admin: boolean;
  };
};
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function registerAccount(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const formData = new FormData();

  formData.append("first_name", data.first_name);
  formData.append("last_name", data.last_name ?? "");
  formData.append("email", data.email);
  formData.append("password", data.password);

  formData.append("account_name", data.account_name);

  formData.append("company_name", data.company_name);
  formData.append("company_code", data.company_code);
 data.industry_codes.forEach((code) => {
  formData.append("industry_codes", code);
});
  formData.append("employee_size", data.employee_size ?? "");
  formData.append("country", data.country);

  formData.append("color", data.color ?? "");

  if (data.logo) {
    formData.append("logo", data.logo);
  }

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to create account.",
    );
  }

  return result;
}

export async function loginAccount(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string" ? result.detail : "Unable to sign in.",
    );
  }

  return result;
}
