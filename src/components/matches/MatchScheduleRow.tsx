"use client";

import Link from "next/link";
import { useState } from "react";
import { TeamFlag, TeamName } from "@/components/teams/TeamFlag";
import { CorrectPredictorAvatars } from "@/components/users/UserAvatar";
import { usePredictionsContext } from "@/contexts/PredictionsContext";
import type { MatchWithCount } from "@/hooks/useMatches";
import {
  formatMatchKickoffTime,
  isMatchOpenForPredictions,
} from "@/lib/match-utils";
import { MatchStatus } from "@prisma/client";
import { MatchLockBadge } from "./MatchLockBadge";

type MatchScheduleRowProps = {
  match: MatchWithCount;
};

type TeamPickRowProps = {
  team: string;
  isSelected: boolean;
  isOpen: boolean;
  isWinner: boolean;
  isSubmitting: boolean;
  disabled: boolean;
  onPick: () => void;
};

function TeamPickRow({
  team,
  isSelected,
  isOpen,
  isWinner,
  isSubmitting,
  disabled,
  onPick,
}: TeamPickRowProps) {
  const content = (
    <>
      <TeamName team={team} flagSize={18} className="font-medium" />
      <span className="flex items-center gap-2 text-xs">
        {isSubmitting && (
          <span className="text-[var(--muted)]">Saving...</span>
        )}
        {isWinner && (
          <span className="font-medium text-emerald-400">Winner</span>
        )}
      </span>
    </>
  );

  if (!isOpen) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 ${
          isSelected ? "bg-emerald-500/20" : ""
        }`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition disabled:opacity-60 ${
        isSelected
          ? "bg-emerald-500/25 ring-1 ring-emerald-500/40"
          : "hover:bg-white/5"
      }`}
    >
      {content}
    </button>
  );
}

export function MatchScheduleRow({ match }: MatchScheduleRowProps) {
  const { getPredictionForMatch, submitPrediction } = usePredictionsContext();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prediction = getPredictionForMatch(match.id);
  const isOpen = isMatchOpenForPredictions(match);
  const isFinished = match.status === MatchStatus.FINISHED;
  const correctPredictors = match.correctPredictors ?? [];
  const hasPick = Boolean(prediction?.predictedWinner);

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
    <article
      className={`border-b border-[var(--border)] px-4 py-4 last:border-b-0 ${
        hasPick ? "bg-emerald-500/10" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--muted)]">
              {match.stage}
            </p>
            <Link
              href={`/matches/${match.id}`}
              className="text-xs text-[var(--muted)] hover:text-white sm:hidden"
            >
              Details
            </Link>
          </div>

          <div className="space-y-1">
            <TeamPickRow
              team={match.homeTeam}
              isSelected={prediction?.predictedWinner === match.homeTeam}
              isOpen={isOpen}
              isWinner={isFinished && match.winner === match.homeTeam}
              isSubmitting={submitting === match.homeTeam}
              disabled={submitting !== null}
              onPick={() => void handleQuickPick(match.homeTeam)}
            />
            <TeamPickRow
              team={match.awayTeam}
              isSelected={prediction?.predictedWinner === match.awayTeam}
              isOpen={isOpen}
              isWinner={isFinished && match.winner === match.awayTeam}
              isSubmitting={submitting === match.awayTeam}
              disabled={submitting !== null}
              onPick={() => void handleQuickPick(match.awayTeam)}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="text-sm font-medium">
              {formatMatchKickoffTime(match.startTime)}
            </p>
            <div className="mt-1 flex items-center justify-end gap-1">
              <TeamFlag team={match.homeTeam} size={14} />
              <TeamFlag team={match.awayTeam} size={14} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MatchLockBadge match={match} />
            <Link
              href={`/matches/${match.id}`}
              className="hidden rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-white/5 hover:text-white sm:inline-block"
            >
              Details
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {isFinished && correctPredictors.length > 0 && (
        <div className="mt-3">
          <CorrectPredictorAvatars predictors={correctPredictors} />
        </div>
      )}
    </article>
  );
}
