"use client";

import { FormEvent, useState } from "react";
import type { Match } from "@/types";
import { ADMIN_MATCH_STAGES } from "@/lib/admin/validations";
import { adminFetch } from "@/lib/admin/client";

type AdminMatch = Match & {
  _count: { predictions: number };
};

type AdminMatchCardProps = {
  match: AdminMatch;
  onUpdated: () => void;
};

function toDateTimeLocalValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminMatchCard({ match, onUpdated }: AdminMatchCardProps) {
  const [homeTeam, setHomeTeam] = useState(match.homeTeam);
  const [awayTeam, setAwayTeam] = useState(match.awayTeam);
  const [stage, setStage] = useState(match.stage);
  const [startTime, setStartTime] = useState(
    toDateTimeLocalValue(
      typeof match.startTime === "string"
        ? match.startTime
        : match.startTime.toISOString(),
    ),
  );
  const [status, setStatus] = useState(match.status);
  const [winner, setWinner] = useState(match.winner ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await adminFetch(`/api/admin/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          stage,
          startTime: new Date(startTime).toISOString(),
          status,
          winner: winner || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to update match");
      }

      onUpdated();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update match",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (!winner) {
      setError("Select a winner before marking the match as completed");
      return;
    }

    setError(null);
    setCompleting(true);

    try {
      const response = await adminFetch(
        `/api/admin/matches/${match.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner }),
        },
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to complete match");
      }

      const updated = await response.json();
      setStatus(updated.status);
      setWinner(updated.winner ?? "");
      onUpdated();
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : "Failed to complete match",
      );
    } finally {
      setCompleting(false);
    }
  }

  const isFinished = status === "FINISHED";

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-[var(--muted)]">{match.stage}</p>
          <h3 className="text-lg font-semibold">
            {match.homeTeam} vs {match.awayTeam}
          </h3>
        </div>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--muted)]">
          {status.toLowerCase()}
        </span>
      </div>

      <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-2 block font-medium">Home team</span>
          <input
            value={homeTeam}
            onChange={(event) => setHomeTeam(event.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium">Away team</span>
          <input
            value={awayTeam}
            onChange={(event) => setAwayTeam(event.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium">Stage</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-3 py-2"
          >
            {ADMIN_MATCH_STAGES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {!ADMIN_MATCH_STAGES.includes(stage as (typeof ADMIN_MATCH_STAGES)[number]) && (
              <option value={stage}>{stage}</option>
            )}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium">Start time</span>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-3 py-2"
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="FINISHED">Finished</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-medium">Winner</span>
          <select
            value={winner}
            onChange={(event) => setWinner(event.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[#0f172a] px-3 py-2"
          >
            <option value="">No winner yet</option>
            <option value={homeTeam}>{homeTeam}</option>
            <option value={awayTeam}>{awayTeam}</option>
          </select>
        </label>

        <p className="text-sm text-[var(--muted)] sm:col-span-2">
          {match._count.predictions} predictions submitted
        </p>

        {error && (
          <p className="text-sm text-red-400 sm:col-span-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          {!isFinished && (
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={completing}
              className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium transition hover:bg-white/5 disabled:opacity-60"
            >
              {completing ? "Completing..." : "Mark completed"}
            </button>
          )}
        </div>
      </form>
    </article>
  );
}
