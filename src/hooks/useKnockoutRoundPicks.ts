"use client";

import { useCallback, useEffect, useState } from "react";
import type { KnockoutRoundKey } from "@/lib/knockout-rounds";
import { resolveUserAvatarUrl } from "@/lib/avatar";

export type KnockoutRoundBoard = {
  rounds: Array<{
    key: KnockoutRoundKey;
    label: string;
    description: string;
    maxPicks: number;
    parentRound: KnockoutRoundKey | null;
  }>;
  picksByRoundTeam: Record<
    string,
    Record<
      string,
      Array<{ userId: string; username: string; avatarUrl: string | null }>
    >
  >;
  resultsByRound: Record<string, { teams: string[]; finalized: boolean }>;
  locked: boolean;
};

type KnockoutRoundPick = {
  id: string;
  round: string;
  team: string;
};

type LoadOptions = {
  silent?: boolean;
};

function parseJsonBody<T>(text: string): T | null {
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text) as T;
}

export function useKnockoutRoundPicks(
  username: string,
  avatarUrl: string | null = null,
) {
  const [board, setBoard] = useState<KnockoutRoundBoard | null>(null);
  const [userPicks, setUserPicks] = useState<KnockoutRoundPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async ({ silent = false }: LoadOptions = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const [boardResponse, picksResponse] = await Promise.all([
          fetch("/api/knockout-round-picks", { cache: "no-store" }),
          fetch(
            `/api/knockout-round-picks?username=${encodeURIComponent(username)}`,
            { cache: "no-store" },
          ),
        ]);

        if (!boardResponse.ok || !picksResponse.ok) {
          throw new Error("Failed to load knockout round picks");
        }

        setBoard((await boardResponse.json()) as KnockoutRoundBoard);
        setUserPicks((await picksResponse.json()) as KnockoutRoundPick[]);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load knockout round picks",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [username],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const togglePick = useCallback(
    async (round: KnockoutRoundKey, team: string) => {
      const response = await fetch("/api/knockout-round-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, round, team }),
        cache: "no-store",
      });

      const text = await response.text();
      if (!response.ok) {
        const payload = parseJsonBody<{ error?: string }>(text) ?? {};
        throw new Error(payload.error ?? "Failed to save knockout round pick");
      }

      const result = parseJsonBody<{
        round: KnockoutRoundKey;
        team: string;
        selected: boolean;
      }>(text);

      if (!result) {
        await load({ silent: true });
        return;
      }

      setUserPicks((current) => {
        if (result.selected) {
          if (
            current.some(
              (pick) => pick.round === result.round && pick.team === result.team,
            )
          ) {
            return current;
          }

          return [
            ...current,
            {
              id: `local-${result.round}-${result.team}`,
              round: result.round,
              team: result.team,
            },
          ];
        }

        return current.filter(
          (pick) =>
            !(
              pick.round === result.round && pick.team === result.team
            ) &&
            !(
              pick.team === result.team &&
              pick.round > result.round
            ),
        );
      });

      setBoard((current) => {
        if (!current) {
          return current;
        }

        const voter = {
          userId: `local-${username}`,
          username,
          avatarUrl: resolveUserAvatarUrl(username, avatarUrl),
        };

        const nextPicksByRoundTeam = { ...current.picksByRoundTeam };
        const roundPicks = { ...(nextPicksByRoundTeam[result.round] ?? {}) };

        if (result.selected) {
          const existing = roundPicks[result.team] ?? [];
          if (!existing.some((entry) => entry.username === username)) {
            roundPicks[result.team] = [...existing, voter];
          }
        } else {
          roundPicks[result.team] = (roundPicks[result.team] ?? []).filter(
            (entry) => entry.username !== username,
          );

          for (const [roundKey, teamsMap] of Object.entries(nextPicksByRoundTeam)) {
            if (roundKey <= result.round) {
              continue;
            }

            const nextTeamsMap = { ...teamsMap };
            delete nextTeamsMap[result.team];
            nextPicksByRoundTeam[roundKey] = nextTeamsMap;
          }
        }

        nextPicksByRoundTeam[result.round] = roundPicks;

        return {
          ...current,
          picksByRoundTeam: nextPicksByRoundTeam,
        };
      });

      void load({ silent: true });
    },
    [username, avatarUrl, load],
  );

  function getUserPicksForRound(round: KnockoutRoundKey) {
    return userPicks
      .filter((pick) => pick.round === round)
      .map((pick) => pick.team);
  }

  return {
    board,
    userPicks,
    loading,
    error,
    reload: load,
    togglePick,
    getUserPicksForRound,
  };
}
