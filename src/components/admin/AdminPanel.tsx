"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Match } from "@/types";
import { adminFetch, clearStoredAdminPassword } from "@/lib/admin/client";
import { AdminMatchCard } from "./AdminMatchCard";
import { CreateMatchForm } from "./CreateMatchForm";

type AdminMatch = Match & {
  _count: { predictions: number };
};

export function AdminPanel() {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    setError(null);

    try {
      const response = await adminFetch("/api/admin/matches");

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to load matches");
      }

      const data = (await response.json()) as AdminMatch[];
      setMatches(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load matches",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Match Admin</h1>
            <p className="text-sm text-[var(--muted)]">
              Create, edit, and complete matches
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
            >
              Back to game
            </Link>
            <button
              type="button"
              onClick={() => {
                clearStoredAdminPassword();
                window.location.reload();
              }}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <CreateMatchForm onCreated={() => void loadMatches()} />

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">All matches</h2>
            <button
              type="button"
              onClick={() => void loadMatches()}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading matches...</p>
          ) : error ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No matches yet.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {matches.map((match) => (
                <AdminMatchCard
                  key={match.id}
                  match={match}
                  onUpdated={() => void loadMatches()}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
