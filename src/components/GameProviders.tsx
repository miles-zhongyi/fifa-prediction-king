"use client";

import { MatchesProvider, useMatchesContext } from "@/contexts/MatchesContext";
import { PredictionsProvider } from "@/contexts/PredictionsContext";

function PredictionsWithMatchSync({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const { reload } = useMatchesContext();

  return (
    <PredictionsProvider username={username} onMatchesStale={() => void reload()}>
      {children}
    </PredictionsProvider>
  );
}

export function GameProviders({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  return (
    <MatchesProvider>
      <PredictionsWithMatchSync username={username}>
        {children}
      </PredictionsWithMatchSync>
    </MatchesProvider>
  );
}
