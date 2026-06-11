"use client";

import { useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { TeamVoters } from "@/components/picks/TeamVoters";
import { MAX_GROUP_ADVANCERS } from "@/lib/groups";

export type GroupBoard = {
  groupKey: string;
  teams: string[];
  picksByTeam: Record<
    string,
    Array<{ userId: string; username: string; avatarUrl: string | null }>
  >;
  locked: boolean;
  result?: {
    advancer1: string | null;
    advancer2: string | null;
    thirdPlaceTeam: string | null;
    thirdAdvances: boolean;
    finalized: boolean;
  } | null;
};

type GroupPickCardProps = {
  board: GroupBoard;
  userPicks: string[];
  onToggle: (team: string) => Promise<void>;
};

export function GroupPickCard({ board, userPicks, onToggle }: GroupPickCardProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(team: string) {
    if (board.locked) {
      return;
    }

    setSubmitting(team);
    setError(null);

    try {
      await onToggle(team);
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to save pick",
      );
    } finally {
      setSubmitting(null);
    }
  }

  const advancers =
    board.result?.finalized && board.result
      ? [board.result.advancer1, board.result.advancer2].filter(
          (team): team is string => Boolean(team),
        )
      : [];

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/[0.03] px-4 py-3">
        <h2 className="text-sm font-semibold">Group {board.groupKey}</h2>
        <span className="text-xs text-[var(--muted)]">
          {userPicks.length}/{MAX_GROUP_ADVANCERS} picked
          {board.locked ? " · Locked" : ""}
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {board.teams.map((team) => {
          const isSelected = userPicks.includes(team);
          const isAdvancer = advancers.includes(team);
          const voters = board.picksByTeam[team] ?? [];

          return (
            <div
              key={team}
              className={`px-4 py-3 ${isSelected ? "bg-emerald-500/10" : ""}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={board.locked || submitting !== null}
                  onClick={() => void handleToggle(team)}
                  className={`flex items-center gap-2 text-left transition disabled:opacity-60 ${
                    board.locked
                      ? "cursor-default"
                      : "rounded-lg px-1 py-1 hover:bg-white/5"
                  }`}
                >
                  <TeamName team={team} flagSize={18} className="font-medium" />
                  {isSelected && (
                    <span className="text-xs font-medium text-emerald-400">
                      Your pick
                    </span>
                  )}
                  {isAdvancer && (
                    <span className="text-xs font-medium text-sky-400">
                      Advanced
                    </span>
                  )}
                  {submitting === team && (
                    <span className="text-xs text-[var(--muted)]">Saving...</span>
                  )}
                </button>

                <div className="min-w-0 sm:max-w-[50%]">
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    Picked by
                  </p>
                  <TeamVoters voters={voters} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="border-t border-[var(--border)] px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
