"use client";

import { useCallback, useEffect, useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { TeamVoters } from "@/components/picks/TeamVoters";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePredictionsContext } from "@/contexts/PredictionsContext";
import { useMatchesContext } from "@/contexts/MatchesContext";
import { useUser } from "@/contexts/UserContext";
import { resolveUserAvatarUrl } from "@/lib/avatar";
import { filterKnockoutMatches, isMatchOpenForPredictions } from "@/lib/match-utils";
import { MatchStatus } from "@prisma/client";
import { CorrectPredictorAvatars } from "@/components/users/UserAvatar";

type MatchVotes = {
  picksByTeam: Record<string, Array<{
    userId: string;
    username: string;
    avatarUrl: string;
  }>>;
};

export function KnockoutBoard() {
  const { username, avatarUrl } = useUser();
  const { matches, loading: matchesLoading, error: matchesError, reload: reloadMatches } =
    useMatchesContext();
  const {
    getPredictionForMatch,
    submitPrediction,
    reload: reloadPredictions,
  } = usePredictionsContext();
  const [votesByMatch, setVotesByMatch] = useState<Record<string, MatchVotes>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const knockoutMatches = filterKnockoutMatches(matches).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const loadVotes = useCallback(async () => {
    const entries = await Promise.all(
      knockoutMatches.map(async (match) => {
        const response = await fetch(
          `/api/predictions/votes?matchId=${encodeURIComponent(match.id)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          return [match.id, { picksByTeam: {} }] as const;
        }

        const data = (await response.json()) as MatchVotes;
        return [match.id, data] as const;
      }),
    );

    setVotesByMatch(Object.fromEntries(entries));
  }, [knockoutMatches]);

  useEffect(() => {
    if (knockoutMatches.length > 0) {
      void loadVotes();
    }
  }, [knockoutMatches, loadVotes]);

  async function handlePick(
    matchId: string,
    team: string,
    teams: [string, string],
  ) {
    setSubmitting(`${matchId}:${team}`);
    setError(null);

    try {
      await submitPrediction(matchId, team);

      const voter = {
        userId: `local-${username}`,
        username,
        avatarUrl: resolveUserAvatarUrl(username, avatarUrl),
      };

      setVotesByMatch((current) => {
        const matchVotes = current[matchId] ?? {
          picksByTeam: { [teams[0]]: [], [teams[1]]: [] },
        };
        const nextPicksByTeam = { ...matchVotes.picksByTeam };

        for (const side of teams) {
          nextPicksByTeam[side] = (nextPicksByTeam[side] ?? []).filter(
            (entry) => entry.username !== username,
          );
        }

        nextPicksByTeam[team] = [...(nextPicksByTeam[team] ?? []), voter];

        return {
          ...current,
          [matchId]: { picksByTeam: nextPicksByTeam },
        };
      });

      void loadVotes();
    } catch (pickError) {
      setError(
        pickError instanceof Error ? pickError.message : "Failed to save pick",
      );
    } finally {
      setSubmitting(null);
    }
  }

  if (matchesLoading) {
    return <LoadingState message="Loading knockout matches..." />;
  }

  if (matchesError) {
    return (
      <ErrorAlert
        message={matchesError}
        onRetry={() => {
          void reloadMatches();
          void reloadPredictions();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Knockout Stage"
        description="Pick the winner of each elimination match. Everyone's picks are visible."
      />

      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {knockoutMatches.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Knockout matches will appear here once the bracket is set.
        </p>
      ) : (
        <div className="space-y-4">
          {knockoutMatches.map((match) => {
            const prediction = getPredictionForMatch(match.id);
            const votes = votesByMatch[match.id];
            const isOpen = isMatchOpenForPredictions(match);
            const isFinished = match.status === MatchStatus.FINISHED;
            const teams = [match.homeTeam, match.awayTeam];

            return (
              <article key={match.id} className="card overflow-hidden">
                <div className="border-b border-[var(--border)] bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold">{match.stage}</p>
                </div>

                <div className="divide-y divide-[var(--border)]">
                  {teams.map((team) => {
                    const isSelected = prediction?.predictedWinner === team;
                    const teamVoters = votes?.picksByTeam[team] ?? [];

                    return (
                      <div
                        key={team}
                        className={`px-4 py-3 ${isSelected ? "bg-emerald-500/10" : ""}`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            disabled={!isOpen || submitting !== null}
                            onClick={() =>
                              void handlePick(match.id, team, [
                                match.homeTeam,
                                match.awayTeam,
                              ])
                            }
                            className="flex items-center gap-2 text-left disabled:opacity-60"
                          >
                            <TeamName team={team} flagSize={18} className="font-medium" />
                            {isSelected && (
                              <span className="text-xs text-emerald-400">Your pick</span>
                            )}
                            {isFinished && match.winner === team && (
                              <span className="text-xs text-sky-400">Winner</span>
                            )}
                          </button>
                          <div className="sm:max-w-[45%]">
                            <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                              Picked by
                            </p>
                            <TeamVoters voters={teamVoters} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isFinished && match.correctPredictors && match.correctPredictors.length > 0 && (
                  <div className="border-t border-[var(--border)] px-4 py-3">
                    <CorrectPredictorAvatars predictors={match.correctPredictors} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
