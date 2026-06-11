"use client";

import { useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { TeamVoters } from "@/components/picks/TeamVoters";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { useGroupPicksContext } from "@/contexts/GroupPicksContext";
import { useThirdPlacePicksContext } from "@/contexts/ThirdPlacePicksContext";

export function ThirdPlaceBoard() {
  const { board, userPicks, loading, error, reload, togglePick } =
    useThirdPlacePicksContext();
  const { userPicks: groupAdvancePicks } = useGroupPicksContext();
  const blockedTeams = new Set(groupAdvancePicks.map((pick) => pick.team));
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  if (loading && !board) {
    return <LoadingState message="Loading third-place picks..." />;
  }

  if (error || !board) {
    return (
      <ErrorAlert
        message={error ?? "Failed to load third-place picks"}
        onRetry={() => void reload()}
      />
    );
  }

  async function handleToggle(team: string) {
    if (!board || board.locked || blockedTeams.has(team)) {
      return;
    }

    setSubmitting(team);
    setPickError(null);

    try {
      await togglePick(team);
    } catch (toggleError) {
      setPickError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to save pick",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Third-Place Advancers"
        description={`Pick ${board.maxPicks} teams you think will advance as the best third-place finishers. Teams you already picked to advance from a group cannot be selected here.`}
      />

      <p className="mb-4 text-sm text-[var(--muted)]">
        {userPicks.length}/{board.maxPicks} selected
        {board.locked ? " · Locked" : ""}
      </p>

      {pickError && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {pickError}
        </p>
      )}

      <div className="space-y-6">
        {board.groups.map(({ groupKey, teams }) => (
          <section key={groupKey} className="card overflow-hidden">
            <h2 className="border-b border-[var(--border)] bg-white/[0.03] px-4 py-3 text-sm font-semibold">
              Group {groupKey}
            </h2>
            <div className="divide-y divide-[var(--border)]">
              {teams.map((team) => {
                const isSelected = userPicks.includes(team);
                const isBlocked = blockedTeams.has(team);
                const voters = board.picksByTeam[team] ?? [];

                return (
                  <div
                    key={team}
                    className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      isSelected ? "bg-emerald-500/10" : ""
                    }`}
                  >
                    <button
                      type="button"
                      disabled={board.locked || isBlocked || submitting !== null}
                      onClick={() => void handleToggle(team)}
                      className="flex flex-wrap items-center gap-2 text-left disabled:opacity-60"
                    >
                      <TeamName team={team} flagSize={18} className="font-medium" />
                      {isSelected && (
                        <span className="text-xs text-emerald-400">Your pick</span>
                      )}
                      {isBlocked && (
                        <span className="text-xs text-amber-400">
                          Group advancer pick
                        </span>
                      )}
                    </button>
                    <div className="sm:max-w-[45%]">
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                        Picked by
                      </p>
                      <TeamVoters voters={voters} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
