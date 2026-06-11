"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { UserAvatar } from "@/components/users/UserAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { useUser } from "@/contexts/UserContext";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { formatPoints } from "@/lib/leaderboard/scoring";

export function LeaderboardTable() {
  const { username } = useUser();
  const { entries, loading, error, reload } = useLeaderboard();

  if (loading) {
    return <LoadingState message="Loading leaderboard..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={() => void reload()} />;
  }

  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Group advancers & 3rd place: 1 pt each · Knockout round picks: 0.5 pt each"
      />

      {entries.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Be the first to make a prediction!"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-white/5 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium text-right">Points</th>
                  <th className="hidden px-4 py-3 font-medium text-right sm:table-cell">
                    Correct
                  </th>
                  <th className="hidden px-4 py-3 font-medium text-right md:table-cell">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {entries.map((entry) => {
                  const isCurrentUser = entry.username === username;

                  return (
                    <tr
                      key={entry.userId}
                      className={
                        isCurrentUser
                          ? "bg-[var(--accent)]/10"
                          : "hover:bg-white/[0.02]"
                      }
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            entry.rank <= 3
                              ? "bg-[var(--accent)] text-black"
                              : "bg-white/10"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            username={entry.username}
                            avatarUrl={entry.avatarUrl}
                            size={32}
                          />
                          <div className="min-w-0">
                            <p className="font-medium">
                              {entry.username}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-[var(--accent)]">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-[var(--muted)]">
                              {entry.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold tabular-nums">
                        {formatPoints(entry.points)}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-[var(--muted)] sm:table-cell">
                        {entry.correctPredictions}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-[var(--muted)] md:table-cell">
                        {entry.totalPredictions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
