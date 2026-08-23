"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import { Shell } from "@/components/dashboard/shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { accessToken, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
    }
  }, [loading, accessToken, router]);

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[var(--background)]
          text-[var(--foreground)]
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              h-8
              w-8
              animate-spin
              rounded-full
              border-2
              border-[var(--border)]
              border-t-[var(--primary)]
            "
          />

          <p
            className="
              mt-4
              text-sm
              text-[var(--foreground-muted)]
            "
          >
            Authenticating...
          </p>
        </div>
      </main>
    );
  }

  if (!accessToken) {
    return null;
  }

  return <Shell>{children}</Shell>;
}
