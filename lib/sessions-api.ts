import { api } from "./api";

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface LogoutResponse {
  message: string;
}

export interface LogoutAllResponse {
  message: string;
  revokedSessions: number;
}

export async function getActiveSessions(
  accessToken: string
): Promise<Session[]> {
  return api.get<Session[]>("/auth/sessions", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function logoutCurrentSession(
  accessToken: string
): Promise<LogoutResponse> {
  return api.post<LogoutResponse>("/auth/logout", undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function logoutAllSessions(
  accessToken: string
): Promise<LogoutAllResponse> {
  return api.post<LogoutAllResponse>("/auth/logout-all", undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function revokeSession(
  accessToken: string,
  sessionId: string
): Promise<LogoutResponse> {
  return api.delete<LogoutResponse>(`/auth/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
