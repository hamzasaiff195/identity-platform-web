"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerificationState = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasVerified = useRef(false);

  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setMessage("Verification token is missing or invalid.");
      return;
    }

    // Prevent duplicate verification requests in React Strict Mode.
    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    async function verifyEmail() {
      try {
        console.log("📧 Verifying email...");

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("API URL is not configured.");
        }

        const response = await fetch(`${apiUrl}/verification/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        });

        const result = await response.json();

        console.log("📧 Verification response:", result);

        if (!response.ok) {
          throw new Error(result?.message || "Email verification failed.");
        }

        setState("success");
        setMessage("Your email has been verified successfully.");

        window.setTimeout(() => {
          router.replace("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("❌ Email verification failed:", error);

        setState("error");

        setMessage(
          error instanceof Error ? error.message : "Email verification failed."
        );
      }
    }

    void verifyEmail();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg">
        {state === "verifying" && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />

            <h1 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
              Verifying your email
            </h1>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-green-600">
              Email Verified
            </h1>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              {message}
            </p>

            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Redirecting you to the dashboard...
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-red-600">
              Verification Failed
            </h1>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              {message}
            </p>

            <button
              type="button"
              onClick={() => router.replace("/")}
              className="mt-6 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Go to Homepage
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />

            <h1 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
              Verifying your email
            </h1>

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Please wait...
            </p>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
