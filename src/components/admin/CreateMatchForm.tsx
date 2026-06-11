"use client";

import { FormEvent, useState } from "react";
import { ADMIN_MATCH_STAGES } from "@/lib/admin/validations";
import { adminFetch } from "@/lib/admin/client";

type CreateMatchFormProps = {
  onCreated: () => void;
};

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CreateMatchForm({ onCreated }: CreateMatchFormProps) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [stage, setStage] = useState<string>(ADMIN_MATCH_STAGES[0]);
  const [startTime, setStartTime] = useState(toDateTimeLocalValue(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await adminFetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          stage,
          startTime: new Date(startTime).toISOString(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to create match");
      }

      setHomeTeam("");
      setAwayTeam("");
      setStage(ADMIN_MATCH_STAGES[0]);
      setStartTime(toDateTimeLocalValue(new Date()));
      onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create match",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
    >
      <h2 className="text-lg font-semibold">Create match</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-black transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create match"}
      </button>
    </form>
  );
}
