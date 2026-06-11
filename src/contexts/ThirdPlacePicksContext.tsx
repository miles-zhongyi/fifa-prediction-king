"use client";

import { createContext, useContext } from "react";
import { useThirdPlacePicks } from "@/hooks/useThirdPlacePicks";

type ThirdPlacePicksContextValue = ReturnType<typeof useThirdPlacePicks>;

const ThirdPlacePicksContext = createContext<ThirdPlacePicksContextValue | null>(
  null,
);

export function ThirdPlacePicksProvider({
  username,
  avatarUrl,
  children,
}: {
  username: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const value = useThirdPlacePicks(username, avatarUrl);

  return (
    <ThirdPlacePicksContext.Provider value={value}>
      {children}
    </ThirdPlacePicksContext.Provider>
  );
}

export function useThirdPlacePicksContext() {
  const context = useContext(ThirdPlacePicksContext);
  if (!context) {
    throw new Error(
      "useThirdPlacePicksContext must be used within ThirdPlacePicksProvider",
    );
  }
  return context;
}
