"use client";

import { useMemo, useState } from "react";
import { TeamName } from "@/components/teams/TeamFlag";
import { TeamVoters } from "@/components/picks/TeamVoters";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import { useGroupPicksContext } from "@/contexts/GroupPicksContext";
import { useKnockoutRoundPicksContext } from "@/contexts/KnockoutRoundPicksContext";
import { useThirdPlacePicksContext } from "@/contexts/ThirdPlacePicksContext";
import {
  ADVANCING_POOL_SIZE,
  type KnockoutRoundKey,
} from "@/lib/knockout-rounds";
import {
  REQUIRED_GROUP_PICKS,
  REQUIRED_THIRD_PLACE_PICKS,
} from "@/lib/knockout-pool";

export function KnockoutRoundPicksBoard() {
  const { userPicks: groupPicks } = useGroupPicksContext();
  const { userPicks: thirdPlacePicks } = useThirdPlacePicksContext();
  const {
    board,
    loading,
    error,
    reload,
    togglePick,
    getUserPicksForRound,
  } = useKnockoutRoundPicksContext();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const advancingPool = useMemo(() => {
    const teams = [
      ...groupPicks.map((pick) => pick.team),
      ...thirdPlacePicks,
    ];
    return [...new Set(teams)].sort();
  }, [groupPicks, thirdPlacePicks]);

  const poolComplete =
    groupPicks.length === REQUIRED_GROUP_PICKS &&
    thirdPlacePicks.length === REQUIRED_THIRD_PLACE_PICKS;

  if (loading && !board) {
    return <LoadingState message="Loading knockout picks..." />;
  }

  if (error || !board) {
    return (
      <ErrorAlert
        message={error ?? "Failed to load knockout picks"}
        onRetry={() => void reload()}
      />
    );
  }

  const activeBoard = board;

  async function handleToggle(round: KnockoutRoundKey, team: string) {
    if (activeBoard.locked || !poolComplete) {
      return;
    }

    setSubmitting(`${round}:${team}`);
    setPickError(null);

    try {
      await togglePick(round, team);
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

  function getEligibleTeams(roundKey: KnockoutRoundKey): string[] {
    const round = activeBoard.rounds.find((entry) => entry.key === roundKey);
    if (!round) {
      return [];
    }

    if (!round.parentRound) {
      return advancingPool;
    }

    return getUserPicksForRound(round.parentRound);
  }

  return (
    <>
      <PageHeader
        title="Knockout Bracket"
        description="After picking your 32 advancing teams, narrow them down: 16 → 8 → 4 → 2 → champion. You can complete every round right away."
      />

      {!poolComplete && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Finish your group advancers ({groupPicks.length}/{REQUIRED_GROUP_PICKS})
          and third-place picks ({thirdPlacePicks.length}/
          {REQUIRED_THIRD_PLACE_PICKS}) before knockout rounds unlock.
        </p>
      )}

      {poolComplete && (
        <p className="mb-4 text-sm text-[var(--muted)]">
          Your pool: {advancingPool.length}/{ADVANCING_POOL_SIZE} teams
          {activeBoard.locked ? " · Locked" : ""}
        </p>
      )}

      {pickError && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {pickError}
        </p>
      )}

      <div className="space-y-6">
        {activeBoard.rounds.map((round) => {
          const userRoundPicks = getUserPicksForRound(round.key);
          const eligibleTeams = getEligibleTeams(round.key);
          const result = activeBoard.resultsByRound[round.key];

          return (
            <section key={round.key} className="card overflow-hidden">
              <div className="flex flex-col gap-1 border-b border-[var(--border)] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{round.label}</h2>
                  <p className="text-xs text-[var(--muted)]">{round.description}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {userRoundPicks.length}/{round.maxPicks} selected
                </span>
              </div>

              {eligibleTeams.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--muted)]">
                  {round.parentRound
                    ? `Pick teams in the previous round first.`
                    : "Complete your advancing pool first."}
                </p>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {eligibleTeams.map((team) => {
                    const isSelected = userRoundPicks.includes(team);
                    const isAdvancer = result?.finalized
                      ? result.teams.includes(team)
                      : false;
                    const voters =
                      activeBoard.picksByRoundTeam[round.key]?.[team] ?? [];

                    return (
                      <div
                        key={team}
                        className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                          isSelected ? "bg-emerald-500/10" : ""
                        }`}
                      >
                        <button
                          type="button"
                          disabled={
                            !poolComplete ||
                            activeBoard.locked ||
                            submitting !== null
                          }
                          onClick={() => void handleToggle(round.key, team)}
                          className="flex flex-wrap items-center gap-2 text-left disabled:opacity-60"
                        >
                          <TeamName
                            team={team}
                            flagSize={18}
                            className="font-medium"
                          />
                          {isSelected && (
                            <span className="text-xs text-emerald-400">
                              Your pick
                            </span>
                          )}
                          {isAdvancer && (
                            <span className="text-xs text-sky-400">
                              Advanced
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
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
