"use client";

import { MatchScheduleRow } from "@/components/matches/MatchScheduleRow";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { useMatchesContext } from "@/contexts/MatchesContext";
import {
  filterOpenGroupStageMatches,
  groupMatchesByDate,
} from "@/lib/match-utils";

export function Dashboard() {
  const { matches, loading, error, reload } = useMatchesContext();
  const openGroupMatches = filterOpenGroupStageMatches(matches);
  const matchesByDate = groupMatchesByDate(openGroupMatches);

  if (loading) {
    return <LoadingState message="Loading group stage matches..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => void reload()} />;
  }

  return (
    <>
      <PageHeader
        title="Group Stage"
        description={`${openGroupMatches.length} match${openGroupMatches.length === 1 ? "" : "es"} open for prediction`}
      />

      {openGroupMatches.length === 0 ? (
        <EmptyState
          title="No open group stage matches"
          description="All group games may have started or finished. Check the leaderboard for results."
        />
      ) : (
        <div className="space-y-6">
          {matchesByDate.map(({ heading, matches: dayMatches }) => (
            <section key={heading} className="card overflow-hidden">
              <h2 className="border-b border-[var(--border)] bg-white/[0.03] px-4 py-3 text-sm font-semibold">
                {heading}
              </h2>
              <div>
                {dayMatches.map((match) => (
                  <MatchScheduleRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
