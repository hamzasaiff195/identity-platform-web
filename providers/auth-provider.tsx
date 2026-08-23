"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  login as loginApi,
  refreshAccessToken,
  type CurrentUser,
} from "@/lib/auth-api";

type AuthContextValue = {
  user: CurrentUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  authenticate: (token: string) => Promise<void>;
  setAccessToken: (token: string | null) => void;
  hasRole: (role: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Prevent multiple startup refresh calls.
   *
   * The shared promise only represents the refresh request.
   * React state updates are handled by the currently mounted effect.
   */
  const restorePromiseRef = useRef<Promise<string> | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
  }, []);

  const authenticate = useCallback(async (token: string) => {
    if (!token) {
      throw new Error("Access token is missing");
    }

    try {
      const currentUser = await getCurrentUser(token);

      console.log("[AUTH] Authenticated user:", currentUser);
      console.log("[AUTH] System roles:", currentUser.systemRoles);

      setAccessTokenState(token);
      setUser(currentUser);
    } catch (error) {
      console.error("[AUTH] Unable to authenticate user:", error);

      setAccessTokenState(null);
      setUser(null);

      throw error;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      console.log("[AUTH] Starting login");

      const result = await loginApi(email.trim(), password);

      console.log("[AUTH] Login API result:", result);
      console.log("[AUTH] Access token exists:", !!result?.accessToken);

      if (!result?.accessToken) {
        throw new Error("Login did not return an access token");
      }

      console.log("[AUTH] Calling authenticate");

      await authenticate(result.accessToken);

      console.log("[AUTH] Authentication complete");
    },
    [authenticate]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user?.systemRoles?.length) {
        return false;
      }

      const wantedRole = normalizeRole(role);

      return user.systemRoles.some((systemRole) => {
        if (!systemRole?.name) {
          return false;
        }

        const roleName = normalizeRole(systemRole.name);

        return roleName === wantedRole;
      });
    },
    [user]
  );

  const isSuperAdmin = useMemo(() => hasRole("SUPER_ADMIN"), [hasRole]);

  const isAdmin = useMemo(() => hasRole("ADMIN"), [hasRole]);

  /**
   * Restore the existing session on application startup.
   */
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        console.log("[AUTH] Restoring session...");

        /**
         * Only share the refresh request.
         *
         * This is important because React Strict Mode can run
         * effects twice in development.
         */
        if (!restorePromiseRef.current) {
          restorePromiseRef.current = refreshAccessToken()
            .then((result) => {
              if (!result?.accessToken) {
                throw new Error(
                  "Refresh response did not contain an access token"
                );
              }

              return result.accessToken;
            })
            .finally(() => {
              restorePromiseRef.current = null;
            });
        }

        const token = await restorePromiseRef.current;

        /**
         * The current effect may have been cleaned up by React.
         * Only the currently mounted effect should update React state.
         */
        if (!mounted) {
          return;
        }

        console.log("[AUTH] Session restored");

        await authenticate(token);
      } catch (error) {
        console.log("[AUTH] No valid session", error);

        if (mounted) {
          setAccessTokenState(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, [authenticate]);

  /**
   * Global authentication events.
   */
  useEffect(() => {
    function handleTokenRefresh(event: Event) {
      const customEvent = event as CustomEvent<{
        accessToken: string;
      }>;

      const newToken = customEvent.detail?.accessToken;

      if (!newToken) {
        return;
      }

      console.log("[AUTH] Access token refreshed");

      setAccessTokenState(newToken);
    }

    function handleSessionExpired() {
      console.log("[AUTH] Authentication session expired");

      setUser(null);
      setAccessTokenState(null);

      router.replace("/login");
    }

    window.addEventListener("auth:access-token-refreshed", handleTokenRefresh);

    window.addEventListener("auth:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener(
        "auth:access-token-refreshed",
        handleTokenRefresh
      );

      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);

    router.replace("/login");
  }, [router]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      login,
      authenticate,
      setAccessToken,
      hasRole,
      isSuperAdmin,
      isAdmin,
      logout,
    }),
    [
      user,
      accessToken,
      loading,
      login,
      authenticate,
      setAccessToken,
      hasRole,
      isSuperAdmin,
      isAdmin,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
