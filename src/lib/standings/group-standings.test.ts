import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  computeGroupStandings,
  deriveGroupResult,
  isGroupStageComplete,
} from "./group-standings";

describe("group standings", () => {
  const teams = ["South Korea", "Czechia", "Mexico", "South Africa"];

  it("ranks teams by points and goal difference", () => {
    const standings = computeGroupStandings(teams, [
      {
        homeTeam: "South Korea",
        awayTeam: "Czechia",
        homeScore: 2,
        awayScore: 0,
        status: MatchStatus.FINISHED,
      },
      {
        homeTeam: "Mexico",
        awayTeam: "South Africa",
        homeScore: 1,
        awayScore: 1,
        status: MatchStatus.FINISHED,
      },
    ]);

    expect(standings[0]?.team).toBe("South Korea");
    expect(standings[0]?.points).toBe(3);
  });

  it("detects when a group is complete", () => {
    const matches = Array.from({ length: 6 }, (_, index) => ({
      status: MatchStatus.FINISHED,
      homeTeam: teams[0],
      awayTeam: teams[1],
      homeScore: index % 2,
      awayScore: 0,
    }));

    expect(isGroupStageComplete(teams, matches)).toBe(true);
  });

  it("derives advancers after all group matches finish", () => {
    const matches = [
      {
        homeTeam: "South Korea",
        awayTeam: "Czechia",
        homeScore: 2,
        awayScore: 0,
        status: MatchStatus.FINISHED,
      },
      {
        homeTeam: "Mexico",
        awayTeam: "South Africa",
        homeScore: 3,
        awayScore: 0,
        status: MatchStatus.FINISHED,
      },
      {
        homeTeam: "South Korea",
        awayTeam: "Mexico",
        homeScore: 1,
        awayScore: 1,
        status: MatchStatus.FINISHED,
      },
      {
        homeTeam: "Czechia",
        awayTeam: "South Africa",
        homeScore: 2,
        awayScore: 1,
        status: MatchStatus.FINISHED,
      },
      {
        homeTeam: "South Korea",
        awayTeam: "South Africa",
        homeScore: 1,
        awayScore: 0,
        status: MatchStatus.FINISHED,
      },
      {
        homeTeam: "Czechia",
        awayTeam: "Mexico",
        homeScore: 0,
        awayScore: 2,
        status: MatchStatus.FINISHED,
      },
    ];

    const result = deriveGroupResult("A", matches);
    expect(result?.finalized).toBe(true);
    expect([result?.advancer1, result?.advancer2]).toContain("South Korea");
    expect([result?.advancer1, result?.advancer2]).toContain("Mexico");
  });
});
