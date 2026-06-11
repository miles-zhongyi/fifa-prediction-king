"use client";

import { useCallback, useEffect, useState } from "react";
import type { GroupBoard } from "@/components/picks/GroupPickCard";
import { resolveUserAvatarUrl } from "@/lib/avatar";

type GroupPick = {
  id: string;
  groupKey: string;
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

export function useGroupPicks(
  username: string,
  avatarUrl: string | null = null,
) {
  const [boards, setBoards] = useState<GroupBoard[]>([]);
  const [userPicks, setUserPicks] = useState<GroupPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async ({ silent = false }: LoadOptions = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const [boardsResponse, picksResponse] = await Promise.all([
          fetch("/api/group-picks", { cache: "no-store" }),
          fetch(`/api/group-picks?username=${encodeURIComponent(username)}`, {
            cache: "no-store",
          }),
        ]);

        if (!boardsResponse.ok || !picksResponse.ok) {
          throw new Error("Failed to load group picks");
        }

        const boardsData = (await boardsResponse.json()) as GroupBoard[];
        const picksData = (await picksResponse.json()) as GroupPick[];

        setBoards(boardsData);
        setUserPicks(picksData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load group picks",
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
    async (groupKey: string, team: string) => {
      const response = await fetch("/api/group-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, groupKey, team }),
        cache: "no-store",
      });

      const text = await response.text();
      if (!response.ok) {
        const payload = parseJsonBody<{ error?: string }>(text) ?? {};
        throw new Error(payload.error ?? "Failed to save group pick");
      }

      const result = parseJsonBody<{
        groupKey: string;
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
              (pick) =>
                pick.groupKey === result.groupKey && pick.team === result.team,
            )
          ) {
            return current;
          }

          return [
            ...current,
            {
              id: `local-${result.groupKey}-${result.team}`,
              groupKey: result.groupKey,
              team: result.team,
            },
          ];
        }

        return current.filter(
          (pick) =>
            !(pick.groupKey === result.groupKey && pick.team === result.team),
        );
      });

      const voter = {
        userId: `local-${username}`,
        username,
        avatarUrl: resolveUserAvatarUrl(username, avatarUrl),
      };

      setBoards((current) =>
        current.map((board) => {
          if (board.groupKey !== result.groupKey) {
            return board;
          }

          const nextPicksByTeam = { ...board.picksByTeam };

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
            ...board,
            picksByTeam: nextPicksByTeam,
          };
        }),
      );

      void load({ silent: true });
    },
    [username, avatarUrl, load],
  );

  function getUserPicksForGroup(groupKey: string) {
    return userPicks
      .filter((pick) => pick.groupKey === groupKey)
      .map((pick) => pick.team);
  }

  return {
    boards,
    loading,
    error,
    reload: load,
    togglePick,
    getUserPicksForGroup,
  };
}
