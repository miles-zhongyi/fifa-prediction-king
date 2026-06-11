"use client";

import { useCallback, useEffect, useState } from "react";
import { resolveUserAvatarUrl } from "@/lib/avatar";

export type ThirdPlaceBoard = {
  groups: Array<{ groupKey: string; teams: string[] }>;
  teams: string[];
  picksByTeam: Record<
    string,
    Array<{ userId: string; username: string; avatarUrl: string | null }>
  >;
  locked: boolean;
  maxPicks: number;
};

type ThirdPlacePick = {
  id: string;
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

export function useThirdPlacePicks(
  username: string,
  avatarUrl: string | null = null,
) {
  const [board, setBoard] = useState<ThirdPlaceBoard | null>(null);
  const [userPicks, setUserPicks] = useState<ThirdPlacePick[]>([]);
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
          fetch("/api/third-place-picks", { cache: "no-store" }),
          fetch(`/api/third-place-picks?username=${encodeURIComponent(username)}`, {
            cache: "no-store",
          }),
        ]);

        if (!boardResponse.ok || !picksResponse.ok) {
          throw new Error("Failed to load third-place picks");
        }

        setBoard((await boardResponse.json()) as ThirdPlaceBoard);
        setUserPicks((await picksResponse.json()) as ThirdPlacePick[]);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load third-place picks",
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
    async (team: string) => {
      const response = await fetch("/api/third-place-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, team }),
        cache: "no-store",
      });

      const text = await response.text();
      if (!response.ok) {
        const payload = parseJsonBody<{ error?: string }>(text) ?? {};
        throw new Error(payload.error ?? "Failed to save third-place pick");
      }

      const result = parseJsonBody<{ team: string; selected: boolean }>(text);
      if (!result) {
        await load({ silent: true });
        return;
      }

      setUserPicks((current) => {
        if (result.selected) {
          if (current.some((pick) => pick.team === result.team)) {
            return current;
          }

          return [
            ...current,
            { id: `local-${result.team}`, team: result.team },
          ];
        }

        return current.filter((pick) => pick.team !== result.team);
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

        const nextPicksByTeam = { ...current.picksByTeam };

        if (result.selected) {
          const existing = nextPicksByTeam[result.team] ?? [];
          if (!existing.some((entry) => entry.username === username)) {
            nextPicksByTeam[result.team] = [...existing, voter];
          }
        } else {
          nextPicksByTeam[result.team] = (
            nextPicksByTeam[result.team] ?? []
          ).filter((entry) => entry.username !== username);
        }

        return {
          ...current,
          picksByTeam: nextPicksByTeam,
        };
      });

      void load({ silent: true });
    },
    [username, avatarUrl, load],
  );

  return {
    board,
    userPicks: userPicks.map((pick) => pick.team),
    loading,
    error,
    reload: load,
    togglePick,
  };
}
