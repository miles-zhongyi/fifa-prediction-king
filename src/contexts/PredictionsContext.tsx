"use client";

import { createContext, useContext } from "react";
import { usePredictions } from "@/hooks/usePredictions";

type PredictionsContextValue = ReturnType<typeof usePredictions>;

const PredictionsContext = createContext<PredictionsContextValue | null>(null);

export function PredictionsProvider({
  username,
  onMatchesStale,
  children,
}: {
  username: string;
  onMatchesStale?: () => void;
  children: React.ReactNode;
}) {
  const value = usePredictions(username, { onMatchesStale });

  return (
    <PredictionsContext.Provider value={value}>
      {children}
    </PredictionsContext.Provider>
  );
}

export function usePredictionsContext() {
  const context = useContext(PredictionsContext);
  if (!context) {
    throw new Error("usePredictionsContext must be used within PredictionsProvider");
  }
  return context;
}
