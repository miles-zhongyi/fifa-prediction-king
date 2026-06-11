"use client";

import { useCallback, useEffect, useState } from "react";
import type { Match, Prediction } from "@/types";

export type PredictionWithMatch = Prediction & {
  user: { id: string; username: string; avatarUrl?: string | null };
  match: Match;
};

type UsePredictionsOptions = {
  onMatchesStale?: () => void | Promise<void>;
};

function parseJsonBody<T>(text: string): T | null {
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text) as T;
}

export function usePredictions(
  username: string,
  { onMatchesStale }: UsePredictionsOptions = {},
) {
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/predictions?username=${encodeURIComponent(username)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("Failed to load predictions");
      }

      const text = await response.text();
      const data = parseJsonBody<PredictionWithMatch[]>(text) ?? [];
      setPredictions(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load predictions",
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitPrediction = useCallback(
    async (matchId: string, predictedWinner: string) => {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, matchId, predictedWinner }),
        cache: "no-store",
      });

      const text = await response.text();

      if (!response.ok) {
        const payload = parseJsonBody<{ error?: string }>(text) ?? {};

        if (
          response.status === 404 &&
          payload.error === "Match not found" &&
          onMatchesStale
        ) {
          await onMatchesStale();
          throw new Error(
            "Match list was refreshed. Please submit your pick again.",
          );
        }

        throw new Error(payload.error ?? "Failed to save prediction");
      }

      const saved = parseJsonBody<PredictionWithMatch>(text);
      if (saved) {
        setPredictions((current) => [
          saved,
          ...current.filter((prediction) => prediction.matchId !== matchId),
        ]);
        return saved;
      }

      await load();
      return null;
    },
    [username, load, onMatchesStale],
  );

  return {
    predictions,
    loading,
    error,
    reload: load,
    submitPrediction,
    getPredictionForMatch: (matchId: string) =>
      predictions.find((prediction) => prediction.matchId === matchId),
  };
}
