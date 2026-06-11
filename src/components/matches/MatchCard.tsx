"use client";

import Link from "next/link";
import { useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { usePredictionsContext } from "@/contexts/PredictionsContext";
import type { MatchWithCount } from "@/hooks/useMatches";
import {
  formatMatchDateTime,
  isMatchOpenForPredictions,
} from "@/lib/match-utils";
import { MatchLockBadge } from "./MatchLockBadge";

type MatchCardProps = {
  match: MatchWithCount;
};

export function MatchCard({ match }: MatchCardProps) {
  const { getPredictionForMatch, submitPrediction } = usePredictionsContext();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prediction = getPredictionForMatch(match.id);
  const isOpen = isMatchOpenForPredictions(match);

  async function handleQuickPick(team: string) {
    setSubmitting(team);
    setError(null);

    try {
      await submitPrediction(match.id, team);
    } catch (pickError) {
      setError(
        pickError instanceof Error
          ? pickError.message
          : "Failed to save prediction",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <article className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {match.stage}
          </p>
          <h2 className="mt-2 space-y-1 text-lg font-semibold sm:text-xl">
            <TeamName team={match.homeTeam} />
            <span className="block text-sm font-normal text-[var(--muted)]">vs</span>
            <TeamName team={match.awayTeam} />
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {formatMatchDateTime(match.startTime)}
          </p>
        </div>
        <MatchLockBadge match={match} />
      </div>

      {prediction && (
        <p className="rounded-lg bg-white/5 px-3 py-2 text-sm">
          Your pick:{" "}
          <span className="font-medium text-[var(--accent)]">
            {prediction.predictedWinner}
          </span>
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {isOpen ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => void handleQuickPick(match.homeTeam)}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {submitting === match.homeTeam ? "Saving..." : match.homeTeam}
          </button>
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => void handleQuickPick(match.awayTeam)}
            className="btn-secondary flex-1 disabled:opacity-60"
          >
            {submitting === match.awayTeam ? "Saving..." : match.awayTeam}
          </button>
        </div>
      ) : (
        match.winner && (
          <p className="text-sm text-[var(--muted)]">
            Winner: <span className="text-white">{match.winner}</span>
          </p>
        )
      )}

      <Link
        href={`/matches/${match.id}`}
        className="text-center text-sm font-medium text-[var(--accent)] hover:underline"
      >
        View match details →
      </Link>
    </article>
  );
}
