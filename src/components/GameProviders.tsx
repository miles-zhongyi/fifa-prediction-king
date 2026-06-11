"use client";

import { GroupPicksProvider } from "@/contexts/GroupPicksContext";
import { KnockoutRoundPicksProvider } from "@/contexts/KnockoutRoundPicksContext";
import { MatchesProvider, useMatchesContext } from "@/contexts/MatchesContext";
import { PredictionsProvider } from "@/contexts/PredictionsContext";
import { ThirdPlacePicksProvider } from "@/contexts/ThirdPlacePicksContext";
import { useUser } from "@/contexts/UserContext";

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

export function GameProviders({ children }: { children: React.ReactNode }) {
  const { username, avatarUrl } = useUser();

  return (
    <MatchesProvider>
      <GroupPicksProvider username={username} avatarUrl={avatarUrl}>
        <ThirdPlacePicksProvider username={username} avatarUrl={avatarUrl}>
          <KnockoutRoundPicksProvider username={username} avatarUrl={avatarUrl}>
            <PredictionsWithMatchSync username={username}>
              {children}
            </PredictionsWithMatchSync>
          </KnockoutRoundPicksProvider>
        </ThirdPlacePicksProvider>
      </GroupPicksProvider>
    </MatchesProvider>
  );
}
