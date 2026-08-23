const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

type ApiResponse<T> = {
  message?: string;
  data: T;
};

export type SystemRole = {
  id: string;
  name: string;
  slug: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isVerified: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  systemRoles: SystemRole[];
};

export type LoginResult = {
  accessToken: string;
  sessionId: string;
  expiresAt: string;
  user: CurrentUser;
  systemRoles: SystemRole[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let result: ApiResponse<T> | null = null;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    if (!response.ok) {
      throw new Error("Request failed");
    }

    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    throw new Error(result?.message || "Request failed");
  }

  return result.data;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  return request<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function refreshAccessToken(): Promise<{
  accessToken: string;
  expiresAt: string;
}> {
  return request<{
    accessToken: string;
    expiresAt: string;
  }>("/auth/refresh", {
    method: "POST",
  });
}

export async function getCurrentUser(
  accessToken: string
): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function forgotPassword(email: string) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email,
    }),
  });
}

export async function resetPassword(token: string, password: string) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      password,
    }),
  });
}
