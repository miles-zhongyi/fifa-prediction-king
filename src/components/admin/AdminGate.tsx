"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  adminFetch,
  clearStoredAdminPassword,
  getStoredAdminPassword,
  setStoredAdminPassword,
} from "@/lib/admin/client";

type AdminGateProps = {
  children: React.ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function verifyStoredPassword() {
      const stored = getStoredAdminPassword();
      if (!stored) {
        setLoading(false);
        return;
      }

      const response = await adminFetch("/api/admin/matches");
      if (response.ok) {
        setAuthenticated(true);
      } else {
        clearStoredAdminPassword();
      }

      setLoading(false);
    }

    void verifyStoredPassword();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    setStoredAdminPassword(password);

    try {
      const response = await adminFetch("/api/admin/matches");

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Invalid admin password");
      }

      setAuthenticated(true);
    } catch (submitError) {
      clearStoredAdminPassword();
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-[var(--muted)]">Loading admin panel...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Enter the admin password to manage matches.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-4 py-3 outline-none focus:border-[var(--accent)]"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
