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

import {
  getTenantAuthorization,
  type TenantAuthorization,
} from "@/lib/authorization-api";

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

  tenantAuthorization: TenantAuthorization | null;

  tenantAuthorizationLoading: boolean;

  loadTenantAuthorization: (tenantId: string) => Promise<void>;

  clearTenantAuthorization: () => void;

  can: (permission: string) => boolean;

  canAny: (permissions: string[]) => boolean;

  canAll: (permissions: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeRole(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizePermission(permission: string): string {
  return permission.trim().toLowerCase();
}

function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`.trim().toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);

  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [tenantAuthorization, setTenantAuthorization] =
    useState<TenantAuthorization | null>(null);

  const [tenantAuthorizationLoading, setTenantAuthorizationLoading] =
    useState(false);

  /**
   * Prevent multiple startup refresh calls.
   *
   * React Strict Mode can execute effects twice in development.
   * Sharing the refresh promise prevents duplicate refresh requests.
   */
  const restorePromiseRef = useRef<Promise<string> | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Access token                                                             */
  /* ------------------------------------------------------------------------ */

  const setAccessToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Authenticate                                                             */
  /* ------------------------------------------------------------------------ */

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
      setTenantAuthorization(null);

      throw error;
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Login                                                                    */
  /* ------------------------------------------------------------------------ */

  const login = useCallback(
    async (email: string, password: string) => {
      console.log("[AUTH] Starting login");

      const result = await loginApi(email.trim(), password);

      console.log("[AUTH] Login API result:", result);
      console.log("[AUTH] Access token exists:", !!result?.accessToken);

      if (!result?.accessToken) {
        throw new Error("Login did not return an access token");
      }

      await authenticate(result.accessToken);
    },
    [authenticate]
  );

  /* ------------------------------------------------------------------------ */
  /* System roles                                                             */
  /* ------------------------------------------------------------------------ */

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

        return normalizeRole(systemRole.name) === wantedRole;
      });
    },
    [user]
  );

  const isSuperAdmin = useMemo(() => hasRole("SUPER_ADMIN"), [hasRole]);

  const isAdmin = useMemo(() => hasRole("ADMIN"), [hasRole]);

  /* ------------------------------------------------------------------------ */
  /* Tenant authorization                                                     */
  /* ------------------------------------------------------------------------ */

  const loadTenantAuthorization = useCallback(
    async (tenantId: string) => {
      if (!tenantId) {
        throw new Error("Tenant ID is required.");
      }

      if (!user?.id) {
        throw new Error("Authenticated user is required.");
      }

      if (!accessToken) {
        throw new Error("Access token is required.");
      }

      setTenantAuthorizationLoading(true);

      try {
        const authorization = await getTenantAuthorization(
          accessToken,
          tenantId,
          user.id
        );

        console.log("[AUTH] Tenant authorization loaded:", authorization);

        setTenantAuthorization(authorization);
      } catch (error) {
        console.error("[AUTH] Failed to load tenant authorization:", error);

        setTenantAuthorization(null);

        throw error;
      } finally {
        setTenantAuthorizationLoading(false);
      }
    },
    [accessToken, user?.id]
  );

  const clearTenantAuthorization = useCallback(() => {
    setTenantAuthorization(null);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Permission helpers                                                       */
  /* ------------------------------------------------------------------------ */

  const can = useCallback(
    (permission: string): boolean => {
      /**
       * SUPER_ADMIN has platform-wide authority.
       *
       * Backend authorization remains the final authority.
       * This only controls the FE experience/navigation.
       */
      if (isSuperAdmin) {
        return true;
      }

      if (!tenantAuthorization?.permissions?.length) {
        return false;
      }

      const wantedPermission = normalizePermission(permission);

      return tenantAuthorization.permissions.some((item) => {
        if (!item?.resource || !item?.action) {
          return false;
        }

        return permissionKey(item.resource, item.action) === wantedPermission;
      });
    },
    [isSuperAdmin, tenantAuthorization]
  );

  const canAny = useCallback(
    (permissions: string[]): boolean => {
      if (!permissions.length) {
        return false;
      }

      return permissions.some((permission) => can(permission));
    },
    [can]
  );

  const canAll = useCallback(
    (permissions: string[]): boolean => {
      if (!permissions.length) {
        return false;
      }

      return permissions.every((permission) => can(permission));
    },
    [can]
  );

  /* ------------------------------------------------------------------------ */
  /* Restore existing session                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        console.log("[AUTH] Restoring session...");

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
          setTenantAuthorization(null);
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

  /* ------------------------------------------------------------------------ */
  /* Global authentication events                                             */
  /* ------------------------------------------------------------------------ */

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
      setTenantAuthorization(null);

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

  /* ------------------------------------------------------------------------ */
  /* Logout                                                                   */
  /* ------------------------------------------------------------------------ */

  const logout = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);
    setTenantAuthorization(null);

    router.replace("/login");
  }, [router]);

  /* ------------------------------------------------------------------------ */
  /* Context value                                                            */
  /* ------------------------------------------------------------------------ */

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

      tenantAuthorization,
      tenantAuthorizationLoading,

      loadTenantAuthorization,
      clearTenantAuthorization,

      can,
      canAny,
      canAll,
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

      tenantAuthorization,
      tenantAuthorizationLoading,

      loadTenantAuthorization,
      clearTenantAuthorization,

      can,
      canAny,
      canAll,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
