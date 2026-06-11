"use client";

import { createContext, useContext } from "react";
import { useMatches } from "@/hooks/useMatches";

type MatchesContextValue = ReturnType<typeof useMatches>;

const MatchesContext = createContext<MatchesContextValue | null>(null);

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const value = useMatches();

  return (
    <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>
  );
}

export function useMatchesContext() {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error("useMatchesContext must be used within MatchesProvider");
  }
  return context;
}
