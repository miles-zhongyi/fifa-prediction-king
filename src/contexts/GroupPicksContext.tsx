"use client";

import { createContext, useContext } from "react";
import { useGroupPicks } from "@/hooks/useGroupPicks";

type GroupPicksContextValue = ReturnType<typeof useGroupPicks>;

const GroupPicksContext = createContext<GroupPicksContextValue | null>(null);

export function GroupPicksProvider({
  username,
  avatarUrl,
  children,
}: {
  username: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const value = useGroupPicks(username, avatarUrl);

  return (
    <GroupPicksContext.Provider value={value}>
      {children}
    </GroupPicksContext.Provider>
  );
}

export function useGroupPicksContext() {
  const context = useContext(GroupPicksContext);
  if (!context) {
    throw new Error("useGroupPicksContext must be used within GroupPicksProvider");
  }
  return context;
}
