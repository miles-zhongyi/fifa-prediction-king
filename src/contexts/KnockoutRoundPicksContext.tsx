"use client";

import { createContext, useContext } from "react";
import { useKnockoutRoundPicks } from "@/hooks/useKnockoutRoundPicks";

type KnockoutRoundPicksContextValue = ReturnType<typeof useKnockoutRoundPicks>;

const KnockoutRoundPicksContext =
  createContext<KnockoutRoundPicksContextValue | null>(null);

export function KnockoutRoundPicksProvider({
  username,
  avatarUrl,
  children,
}: {
  username: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const value = useKnockoutRoundPicks(username, avatarUrl);

  return (
    <KnockoutRoundPicksContext.Provider value={value}>
      {children}
    </KnockoutRoundPicksContext.Provider>
  );
}

export function useKnockoutRoundPicksContext() {
  const context = useContext(KnockoutRoundPicksContext);
  if (!context) {
    throw new Error(
      "useKnockoutRoundPicksContext must be used within KnockoutRoundPicksProvider",
    );
  }
  return context;
}
