"use client";

import { useCallback, useEffect, useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { adminFetch } from "@/lib/admin/client";
import { KNOCKOUT_ROUNDS, type KnockoutRoundKey } from "@/lib/knockout-rounds";

type KnockoutRoundResult = {
  round: KnockoutRoundKey;
  teams: string[];
  finalized: boolean;
};

export function AdminKnockoutRoundResults() {
  const [results, setResults] = useState<KnockoutRoundResult[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const response = await adminFetch("/api/admin/knockout-round-results");

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Failed to load knockout round results");
    }

    setResults((await response.json()) as KnockoutRoundResult[]);
  }, []);

  useEffect(() => {
    void load().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load knockout round results",
      );
    });
  }, [load]);

  async function saveRound(round: KnockoutRoundKey, teams: string[], finalized: boolean) {
    setSaving(round);
    setError(null);

    try {
      const response = await adminFetch(
        `/api/admin/knockout-round-results/${round}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teams, finalized }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save knockout round result");
      }

      const updated = (await response.json()) as KnockoutRoundResult;
      setResults((current) =>
        current.map((entry) => (entry.round === round ? updated : entry)),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save knockout round result",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="card p-4">
      <h2 className="mb-4 text-lg font-semibold">Knockout Round Results</h2>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="space-y-6">
        {KNOCKOUT_ROUNDS.map((round) => {
          const result = results.find((entry) => entry.round === round.key);
          const teams = result?.teams ?? [];

          return (
            <div
              key={round.key}
              className="rounded-lg border border-[var(--border)] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{round.label}</h3>
                  <p className="text-xs text-[var(--muted)]">
                    {round.maxPicks} teams advance
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={result?.finalized ?? false}
                    onChange={(event) =>
                      void saveRound(
                        round.key,
                        teams,
                        event.target.checked,
                      )
                    }
                    disabled={saving === round.key}
                  />
                  Finalized
                </label>
              </div>

              <textarea
                className="input min-h-[80px] w-full font-mono text-sm"
                placeholder="One team per line"
                value={teams.join("\n")}
                onChange={(event) => {
                  const nextTeams = event.target.value
                    .split("\n")
                    .map((team) => team.trim())
                    .filter(Boolean);

                  setResults((current) => {
                    const existing = current.find(
                      (entry) => entry.round === round.key,
                    );

                    if (existing) {
                      return current.map((entry) =>
                        entry.round === round.key
                          ? { ...entry, teams: nextTeams }
                          : entry,
                      );
                    }

                    return [
                      ...current,
                      {
                        round: round.key,
                        teams: nextTeams,
                        finalized: false,
                      },
                    ];
                  });
                }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {teams.map((team) => (
                  <TeamName key={team} team={team} flagSize={16} />
                ))}
              </div>

              <button
                type="button"
                className="btn-primary mt-3"
                disabled={saving === round.key}
                onClick={() =>
                  void saveRound(
                    round.key,
                    teams,
                    result?.finalized ?? false,
                  )
                }
              >
                {saving === round.key ? "Saving..." : "Save round"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
