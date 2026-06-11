"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchCorrectPredictor } from "@/types";
import type { Match } from "@/types";

export type MatchWithCount = Match & {
  _count: { predictions: number };
  correctPredictors?: MatchCorrectPredictor[];
};

export function useMatches() {
  const [matches, setMatches] = useState<MatchWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load matches");
      }

      const data = (await response.json()) as MatchWithCount[];
      setMatches(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load matches",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { matches, loading, error, reload: load };
}

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<MatchWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Match not found");
      }

      const data = await response.json();
      setMatch({
        ...data,
        _count: { predictions: data.predictions?.length ?? 0 },
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load match",
      );
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { match, loading, error, reload: load };
}
