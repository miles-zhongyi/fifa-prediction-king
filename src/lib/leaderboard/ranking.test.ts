import { describe, expect, it } from "vitest";
import { assignRanks, rankLeaderboard, sortLeaderboardEntries } from "./ranking";

describe("sortLeaderboardEntries", () => {
  it("sorts by points descending", () => {
    const sorted = sortLeaderboardEntries([
      { username: "bob", points: 2 },
      { username: "alice", points: 5 },
      { username: "carol", points: 3 },
    ]);

    expect(sorted.map((entry) => entry.username)).toEqual([
      "alice",
      "carol",
      "bob",
    ]);
  });

  it("breaks ties alphabetically by username", () => {
    const sorted = sortLeaderboardEntries([
      { username: "zoe", points: 4 },
      { username: "amy", points: 4 },
      { username: "mia", points: 4 },
    ]);

    expect(sorted.map((entry) => entry.username)).toEqual(["amy", "mia", "zoe"]);
  });
});

describe("assignRanks", () => {
  it("uses competition ranking for tied scores", () => {
    const ranked = assignRanks([
      { username: "alice", points: 10 },
      { username: "bob", points: 10 },
      { username: "carol", points: 7 },
      { username: "dan", points: 7 },
      { username: "erin", points: 7 },
    ]);

    expect(ranked.map((entry) => entry.rank)).toEqual([1, 1, 3, 3, 3]);
  });
});

describe("rankLeaderboard", () => {
  it("sorts descending and assigns ranks in one step", () => {
    const ranked = rankLeaderboard([
      { username: "bob", points: 2 },
      { username: "alice", points: 5 },
      { username: "carol", points: 5 },
    ]);

    expect(ranked).toEqual([
      { username: "alice", points: 5, rank: 1 },
      { username: "carol", points: 5, rank: 1 },
      { username: "bob", points: 2, rank: 3 },
    ]);
  });
});
