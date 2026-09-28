export type RegisterRequest = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  account_name: string;
  company_name: string;
  industry_type: string;
  employee_size: string | null;
  country: string;
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
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function registerAccount(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
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
      typeof result.detail === "string"
        ? result.detail
        : "Unable to create account.",
    );
  }

  return result;
}

export async function loginAccount(
  data: LoginRequest,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Unable to sign in.",
    );
  }

  return result;
}