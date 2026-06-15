"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Match } from "@/types";
import { adminFetch, clearStoredAdminPassword } from "@/lib/admin/client";
import { AdminGroupResults } from "./AdminGroupResults";
import { AdminKnockoutRoundResults } from "./AdminKnockoutRoundResults";
import { AdminMatchCard } from "./AdminMatchCard";
import { CreateMatchForm } from "./CreateMatchForm";

type AdminMatch = Match & {
  _count: { predictions: number };
};

export function AdminPanel() {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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

  async function syncMatchResults() {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/sync-matches", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to sync match results");
      }

      const result = (await response.json()) as {
        updated: number;
        skipped?: boolean;
      };

      setSyncMessage(
        result.skipped
          ? "Sync skipped (no API key or throttled)."
          : `Synced ${result.updated} match(es) from football-data.org.`,
      );
      await loadMatches();
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Failed to sync match results",
      );
    } finally {
      setSyncing(false);
    }
  }

  async function downloadExport() {
    setExporting(true);
    setExportMessage(null);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/export-data");

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to export data");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "fifa-export.tar.gz";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setExportMessage(`Downloaded ${filename}. Send this file to your server admin.`);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Failed to export data",
      );
    } finally {
      setExporting(false);
    }
  }

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

        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Live score sync</h2>
              <p className="text-sm text-[var(--muted)]">
                Pulls finished match scores from football-data.org when{" "}
                <code className="text-xs">FOOTBALL_DATA_API_KEY</code> is set.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void syncMatchResults()}
              disabled={syncing}
              className="btn-primary"
            >
              {syncing ? "Syncing..." : "Sync now"}
            </button>
          </div>
          {syncMessage && (
            <p className="mt-3 text-sm text-emerald-300">{syncMessage}</p>
          )}
        </section>

        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Export site data</h2>
              <p className="text-sm text-[var(--muted)]">
                Downloads <code className="text-xs">prod.db</code>,{" "}
                <code className="text-xs">game-data.json</code>, and uploaded
                avatars as a <code className="text-xs">.tar.gz</code> archive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void downloadExport()}
              disabled={exporting}
              className="btn-primary"
            >
              {exporting ? "Preparing..." : "Download export"}
            </button>
          </div>
          {exportMessage && (
            <p className="mt-3 text-sm text-emerald-300">{exportMessage}</p>
          )}
        </section>

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

        <AdminGroupResults />
        <AdminKnockoutRoundResults />
      </div>
    </div>
  );
}
