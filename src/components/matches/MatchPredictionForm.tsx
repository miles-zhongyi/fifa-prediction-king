"use client";

import { useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { isMatchOpenForPredictions } from "@/lib/match-utils";
import type { Match } from "@/types";

type MatchPredictionFormProps = {
  match: Pick<Match, "id" | "homeTeam" | "awayTeam" | "status" | "startTime">;
  currentPick?: string;
  onSubmit: (predictedWinner: string) => Promise<void>;
  layout?: "compact" | "full";
};

export function MatchPredictionForm({
  match,
  currentPick,
  onSubmit,
  layout = "full",
}: MatchPredictionFormProps) {
  const [selected, setSelected] = useState(currentPick ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isOpen = isMatchOpenForPredictions(match);
  const teams = [match.homeTeam, match.awayTeam];

  async function handleSubmit(team: string) {
    setSelected(team);
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      await onSubmit(team);
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save prediction",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 text-sm text-[var(--muted)]">
        {currentPick
          ? `Your prediction: ${currentPick}`
          : "Predictions are closed for this match."}
      </div>
    );
  }

  const buttonClass =
    layout === "full"
      ? "flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-6 text-center transition sm:py-8"
      : "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition";

  return (
    <div className="space-y-3">
      <div
        className={
          layout === "full"
            ? "grid gap-3 sm:grid-cols-2"
            : "flex flex-wrap gap-2"
        }
      >
        {teams.map((team) => {
          const isSelected = selected === team || currentPick === team;

          return (
            <button
              key={team}
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit(team)}
              className={`${buttonClass} disabled:opacity-60 ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-white"
                  : "border-[var(--border)] bg-[#0f172a] hover:border-[var(--accent)]/50 hover:bg-white/5"
              }`}
            >
              {layout === "full" ? (
                <>
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    Predict winner
                  </span>
                  <TeamName team={team} flagSize={24} className="text-lg font-semibold" />
                </>
              ) : (
                <TeamName team={team} flagSize={16} className="text-sm font-medium" />
              )}
              {isSelected && layout === "full" && (
                <span className="text-xs text-[var(--accent)]">Your pick</span>
              )}
            </button>
          );
        })}
      </div>

      {submitting && (
        <p className="text-sm text-[var(--muted)]">Saving prediction...</p>
      )}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-sm text-green-400">Prediction saved!</p>
      )}
    </div>
  );
}
