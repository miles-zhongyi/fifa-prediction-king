"use client";

import Link from "next/link";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePredictionsContext } from "@/contexts/PredictionsContext";
import { useMatch } from "@/hooks/useMatches";
import { TeamName } from "@/components/teams/TeamFlag";
import { CorrectPredictorAvatars } from "@/components/users/UserAvatar";
import { formatMatchDateTime } from "@/lib/match-utils";
import { MatchLockBadge } from "./MatchLockBadge";
import { MatchPredictionForm } from "./MatchPredictionForm";

type MatchDetailProps = {
  matchId: string;
};

export function MatchDetail({ matchId }: MatchDetailProps) {
  const { match, loading, error, reload } = useMatch(matchId);
  const {
    getPredictionForMatch,
    submitPrediction,
    loading: predictionsLoading,
  } = usePredictionsContext();

  if (loading) {
    return <LoadingState message="Loading match..." />;
  }

  if (error || !match) {
    return (
      <div className="space-y-4">
        <ErrorAlert
          message={error ?? "Match not found"}
          onRetry={() => void reload()}
        />
        <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const prediction = getPredictionForMatch(match.id);

  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-[var(--muted)] hover:text-white"
      >
        ← Back to dashboard
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--muted)]">{match.stage}</p>
            <h1 className="mt-2 space-y-2 text-2xl font-bold sm:text-3xl">
              <TeamName team={match.homeTeam} flagSize={28} />
              <span className="block text-base font-normal text-[var(--muted)]">vs</span>
              <TeamName team={match.awayTeam} flagSize={28} />
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {formatMatchDateTime(match.startTime)}
            </p>
          </div>
          <MatchLockBadge match={match} />
        </div>

        <div className="mt-2 grid gap-4 border-t border-[var(--border)] pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Home
            </p>
            <TeamName team={match.homeTeam} flagSize={22} className="mt-1 justify-center text-lg font-semibold" />
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Status
            </p>
            <p className="mt-1 text-lg font-semibold capitalize">
              {match.status.toLowerCase()}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Away
            </p>
            <TeamName team={match.awayTeam} flagSize={22} className="mt-1 justify-center text-lg font-semibold" />
          </div>
        </div>

        {match.winner && (
          <div className="mt-6 space-y-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3">
            <p className="text-center">
              Final winner:{" "}
              <span className="font-semibold">{match.winner}</span>
            </p>
            {match.correctPredictors && match.correctPredictors.length > 0 && (
              <div className="flex justify-center">
                <CorrectPredictorAvatars predictors={match.correctPredictors} />
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Your prediction</h2>
          {predictionsLoading ? (
            <LoadingState message="Loading your prediction..." />
          ) : (
            <MatchPredictionForm
              match={match}
              currentPick={prediction?.predictedWinner}
              onSubmit={async (team) => {
                await submitPrediction(match.id, team);
              }}
              layout="full"
            />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {match._count.predictions} total predictions
        </p>
      </div>
    </>
  );
}
