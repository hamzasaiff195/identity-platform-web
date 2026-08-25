"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/providers/auth-provider";

import { getTenants, type Tenant } from "@/lib/tenants-api";

type TenantContextValue = {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  loading: boolean;
  error: string | null;

  selectTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

const STORAGE_KEY = "identity-platform:current-tenant";

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user, loading: authLoading } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTenants() {
    if (!accessToken || !user) {
      setTenants([]);
      setCurrentTenant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTenants(accessToken, 1, 100);

      const loadedTenants = response.tenants ?? [];

      setTenants(loadedTenants);

      // ------------------------------------------------------------
      // Restore previously selected tenant
      // ------------------------------------------------------------

      let storedTenantId: string | null = null;

      if (typeof window !== "undefined") {
        storedTenantId = window.localStorage.getItem(STORAGE_KEY);
      }

      const storedTenant =
        loadedTenants.find((tenant) => tenant.id === storedTenantId) ?? null;

      if (storedTenant) {
        setCurrentTenant(storedTenant);
      } else if (loadedTenants.length > 0) {
        setCurrentTenant(loadedTenants[0]);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, loadedTenants[0].id);
        }
      } else {
        setCurrentTenant(null);

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tenants";

      setError(message);
      setTenants([]);
      setCurrentTenant(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadTenants();
  }, [authLoading, accessToken, user]);

  function selectTenant(tenantId: string) {
    const tenant = tenants.find((item) => item.id === tenantId) ?? null;

    if (!tenant) {
      return;
    }

    setCurrentTenant(tenant);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, tenant.id);
    }
  }

  async function refreshTenants() {
    await loadTenants();
  }

  const value = useMemo(
    () => ({
      tenants,
      currentTenant,
      loading,
      error,
      selectTenant,
      refreshTenants,
    }),
    [tenants, currentTenant, loading, error]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used inside TenantProvider");
  }

  return context;
}
