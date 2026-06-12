"use client";

import { MatchStatus } from "@prisma/client";
import { TeamName } from "@/components/teams/TeamFlag";
import { AdvanceVoters } from "@/components/picks/AdvanceVoters";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { MatchLockBadge } from "@/components/matches/MatchLockBadge";
import { useMatchesContext } from "@/contexts/MatchesContext";
import {
  filterKnockoutMatches,
  groupMatchesByDate,
  isGroupStageMatch,
} from "@/lib/match-utils";
import { CorrectPredictorAvatars } from "@/components/users/UserAvatar";

function formatScore(
  homeScore: number | null,
  awayScore: number | null,
): string | null {
  if (homeScore === null || awayScore === null) {
    return null;
  }

  return `${homeScore} – ${awayScore}`;
}

type MatchResultsBoardProps = {
  embedded?: boolean;
};

export function MatchResultsBoard({ embedded = false }: MatchResultsBoardProps) {
  const { matches, loading, error, reload } = useMatchesContext();

  if (loading && matches.length === 0) {
    return <LoadingState message="Loading match results..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => void reload()} />;
  }

  const groupMatches = matches.filter((match) => isGroupStageMatch(match.stage));
  const knockoutMatches = filterKnockoutMatches(matches);
  const groupedGroupMatches = groupMatchesByDate(groupMatches);

  const content = (
      <div className="space-y-8">
        {groupedGroupMatches.map(({ heading, matches: dayMatches }) => (
          <section key={heading}>
            <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">
              {heading}
            </h2>
            <div className="space-y-4">
              {dayMatches.map((match) => {
                const isFinished = match.status === MatchStatus.FINISHED;
                const score = formatScore(match.homeScore, match.awayScore);
                const homeWon = isFinished && match.winner === match.homeTeam;
                const awayWon = isFinished && match.winner === match.awayTeam;

                return (
                  <article key={match.id} className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-white/[0.03] px-4 py-3">
                      <p className="text-sm font-semibold">{match.stage}</p>
                      <div className="flex items-center gap-2">
                        {score && (
                          <span className="text-sm font-medium">{score}</span>
                        )}
                        <MatchLockBadge match={match} />
                      </div>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                      <div
                        className={`px-4 py-3 ${homeWon ? "bg-emerald-500/10" : ""}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <TeamName
                              team={match.homeTeam}
                              flagSize={18}
                              className="font-medium"
                            />
                            {homeWon && (
                              <span className="text-sm text-emerald-400">✓</span>
                            )}
                          </div>
                          {match.advanceVoters && (
                            <div className="sm:max-w-[50%]">
                              <AdvanceVoters
                                label="Picked to advance"
                                voters={match.advanceVoters.home.voters}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`px-4 py-3 ${awayWon ? "bg-emerald-500/10" : ""}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <TeamName
                              team={match.awayTeam}
                              flagSize={18}
                              className="font-medium"
                            />
                            {awayWon && (
                              <span className="text-sm text-emerald-400">✓</span>
                            )}
                          </div>
                          {match.advanceVoters && (
                            <div className="sm:max-w-[50%]">
                              <AdvanceVoters
                                label="Picked to advance"
                                voters={match.advanceVoters.away.voters}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isFinished &&
                      match.correctPredictors &&
                      match.correctPredictors.length > 0 && (
                        <div className="border-t border-[var(--border)] px-4 py-3">
                          <CorrectPredictorAvatars
                            predictors={match.correctPredictors}
                          />
                        </div>
                      )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {knockoutMatches.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">
              Knockout
            </h2>
            <div className="space-y-4">
              {knockoutMatches.map((match) => {
                const isFinished = match.status === MatchStatus.FINISHED;
                const score = formatScore(match.homeScore, match.awayScore);

                return (
                  <article key={match.id} className="card p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{match.stage}</p>
                      <MatchLockBadge match={match} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TeamName team={match.homeTeam} flagSize={18} />
                        {score && <span className="text-sm">{score}</span>}
                        {isFinished && match.winner === match.homeTeam && (
                          <span className="text-emerald-400">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <TeamName team={match.awayTeam} flagSize={18} />
                        {isFinished && match.winner === match.awayTeam && (
                          <span className="text-emerald-400">✓</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <PageHeader
        title="Match Results"
        description="Live scores sync from football-data.org when an API key is configured. Advance picks show ✓ when correct and ✗ when eliminated."
      />
      {content}
    </>
  );
}
