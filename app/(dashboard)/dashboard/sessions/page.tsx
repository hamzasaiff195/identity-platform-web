"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  getActiveSessions,
  revokeSession,
  type Session,
} from "@/lib/sessions-api";

export default function SessionsPage() {
  const { accessToken } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // ===========================================================================
  // Load sessions
  // ===========================================================================

  const loadSessions = useCallback(async () => {
    if (!accessToken) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getActiveSessions(accessToken);

      setSessions(result);

      // Keep currently opened modal synchronized.
      setSelectedSession((current) => {
        if (!current) {
          return null;
        }

        const updatedSession = result.find(
          (session) => session.id === current.id
        );

        return updatedSession ?? null;
      });
    } catch (error) {
      console.error("[SESSIONS] Failed to load sessions:", error);

      setSessions([]);

      setError(
        error instanceof Error ? error.message : "Unable to load sessions"
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // ===========================================================================
  // Initial load
  // ===========================================================================

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ===========================================================================
  // Revoke session
  // ===========================================================================

  async function handleRevoke(session: Session) {
    if (!accessToken) {
      return;
    }

    // Current session can NEVER be revoked from this page.
    if (session.current) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to revoke this session?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await revokeSession(accessToken, session.id);

      // Close modal if this session was being viewed.
      setSelectedSession(null);

      await loadSessions();
    } catch (error) {
      console.error("[SESSIONS] Failed to revoke session:", error);

      setError(
        error instanceof Error ? error.message : "Unable to revoke session"
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ===========================================================================
  // Authentication loading
  // ===========================================================================

  if (!accessToken && loading) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingState text="Authenticating..." />
        </div>
      </main>
    );
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
          Security
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Active Sessions
            </h1>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Review devices currently signed in to your account.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSessions}
            disabled={loading || actionLoading}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          <span>{error}</span>

          <button
            type="button"
            onClick={loadSessions}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <section className="flex min-h-[400px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <LoadingState text="Loading active sessions..." />
        </section>
      ) : sessions.length === 0 ? (
        /* Empty */
        <section className="flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background)] text-xl text-[var(--foreground-muted)]">
              ◇
            </div>

            <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
              No active sessions
            </p>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              There are currently no active sessions.
            </p>
          </div>
        </section>
      ) : (
        /* Sessions */
        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          {/* Section header */}
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Signed-in devices
            </h2>

            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              {sessions.length} active{" "}
              {sessions.length === 1 ? "session" : "sessions"}
            </p>
          </div>

          {/* Session rows */}
          <div className="divide-y divide-[var(--border)]">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                actionLoading={actionLoading}
                onView={() => setSelectedSession(session)}
                onRevoke={() => handleRevoke(session)}
              />
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          Session Detail Modal

          Current session:
          - Can view
          - Cannot revoke

          Other sessions:
          - Can view
          - Can revoke
          ===================================================================== */}

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          loading={actionLoading}
          onClose={() => setSelectedSession(null)}
          onRevoke={() => handleRevoke(selectedSession)}
        />
      )}
    </main>
  );
}

// =============================================================================
// Session Row
// =============================================================================

function SessionRow({
  session,
  actionLoading,
  onView,
  onRevoke,
}: {
  session: Session;
  actionLoading: boolean;
  onView: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      {/* Session information */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {session.current ? "Current device" : "Active session"}
          </p>

          {session.current && (
            <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
              Current session
            </span>
          )}
        </div>

        <p className="mt-1 truncate font-mono text-xs text-[var(--foreground-muted)]">
          {session.id}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--foreground-muted)]">
          <span>Created {formatDateTime(session.createdAt)}</span>
          <span>Expires {formatDateTime(session.expiresAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          {/* VIEW IS AVAILABLE FOR BOTH CURRENT AND OTHER SESSIONS */}
          <button
            type="button"
            onClick={onView}
            disabled={actionLoading}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            View details
          </button>

          {/* REVOKE ONLY FOR NON-CURRENT SESSIONS */}
          {!session.current && (
            <button
              type="button"
              onClick={onRevoke}
              disabled={actionLoading}
              className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? "Revoking..." : "Revoke"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Session Detail Modal
// =============================================================================

function SessionDetailModal({
  session,
  loading,
  onClose,
  onRevoke,
}: {
  session: Session;
  loading: boolean;
  onClose: () => void;
  onRevoke: () => void;
}) {
  const isCurrent = session.current;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
              Security
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              Session Details
            </h2>

            {isCurrent && (
              <span className="mt-2 inline-flex rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                Current session
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-[var(--foreground-muted)] transition hover:bg-[var(--background)]"
          >
            ×
          </button>
        </div>

        {/* Details */}
        <div className="space-y-5 px-6 py-6">
          <DetailField label="Session ID" value={session.id} mono />

          <DetailField
            label="Status"
            value={isCurrent ? "CURRENT SESSION" : "ACTIVE"}
          />

          <DetailField
            label="Created At"
            value={formatDateTime(session.createdAt)}
          />

          <DetailField
            label="Updated At"
            value={formatDateTime(session.updatedAt)}
          />

          <DetailField
            label="Expires At"
            value={formatDateTime(session.expiresAt)}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          {/* Revoke only for non-current session */}
          {!isCurrent ? (
            <button
              type="button"
              onClick={onRevoke}
              disabled={loading}
              className="rounded-lg border border-[var(--danger)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Revoking..." : "Revoke session"}
            </button>
          ) : (
            <span className="text-xs text-[var(--foreground-muted)]">
              This is your current session
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Detail Field
// =============================================================================

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
        {label}
      </p>

      <p
        className={`break-all text-sm text-[var(--foreground)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// =============================================================================
// Loading
// =============================================================================

function LoadingState({ text }: { text: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />

      <p className="mt-4 text-sm text-[var(--foreground-muted)]">{text}</p>
    </div>
  );
}

// =============================================================================
// Date formatting
// =============================================================================

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
