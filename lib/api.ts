import { refreshAccessToken } from "@/lib/auth-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiResponse<T> = {
  message?: string;
  data: T;
};

let refreshPromise: Promise<string> | null = null;

async function refreshToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken()
      .then((result) => {
        if (!result?.accessToken) {
          throw new Error("Refresh response did not contain an access token");
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:access-token-refreshed", {
              detail: {
                accessToken: result.accessToken,
              },
            })
          );
        }

        return result.accessToken;
      })
      .catch((error) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:session-expired"));
        }

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // ---------------------------------------------------------------------------
  // Access token expired
  // ---------------------------------------------------------------------------

  if (response.status === 401 && retry) {
    try {
      const newAccessToken = await refreshToken();

      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${newAccessToken}`);

      return request<T>(
        path,
        {
          ...options,
          headers,
        },
        false
      );
    } catch {
      throw new Error("Authentication session expired");
    }
  }

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("Invalid response from server");
  }

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------

export const api = {
  get<T>(path: string, options: RequestInit = {}): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "GET",
    });
  },

  post<T>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, options: RequestInit = {}): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "DELETE",
    });
  },
};
