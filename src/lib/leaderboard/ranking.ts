export type RankableEntry = {
  points: number;
  username: string;
};

export type RankedEntry<T extends RankableEntry> = T & {
  rank: number;
};

export function sortLeaderboardEntries<T extends RankableEntry>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return a.username.localeCompare(b.username);
  });
}

export function assignRanks<T extends RankableEntry>(
  sortedEntries: T[],
): RankedEntry<T>[] {
  let rank = 0;
  let previousPoints: number | null = null;

  return sortedEntries.map((entry, index) => {
    if (previousPoints === null || entry.points !== previousPoints) {
      rank = index + 1;
      previousPoints = entry.points;
    }

    return {
      ...entry,
      rank,
    };
  });
}

export function rankLeaderboard<T extends RankableEntry>(
  entries: T[],
): RankedEntry<T>[] {
  return assignRanks(sortLeaderboardEntries(entries));
}
