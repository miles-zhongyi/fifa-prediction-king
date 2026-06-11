import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  filterOpenGroupStageMatches,
  groupMatchesByDate,
  isGroupStageMatch,
} from "./match-utils";

const now = new Date("2026-06-12T12:00:00.000Z");

function match(
  stage: string,
  startTime: string,
  status: MatchStatus = MatchStatus.SCHEDULED,
) {
  return {
    id: `${stage}-${startTime}`,
    stage,
    startTime,
    status,
    homeTeam: "A",
    awayTeam: "B",
  };
}

describe("isGroupStageMatch", () => {
  it("recognises group stage labels", () => {
    expect(isGroupStageMatch("Group A")).toBe(true);
    expect(isGroupStageMatch("Group L")).toBe(true);
  });

  it("rejects knockout stages", () => {
    expect(isGroupStageMatch("Quarter Final")).toBe(false);
    expect(isGroupStageMatch("Round of 16")).toBe(false);
  });
});

describe("filterOpenGroupStageMatches", () => {
  it("returns only open group stage fixtures", () => {
    const result = filterOpenGroupStageMatches(
      [
        match("Group A", "2026-06-12T18:00:00.000Z"),
        match("Group B", "2026-06-12T18:00:00.000Z"),
        match("Group A", "2026-06-11T18:00:00.000Z"),
        match("Quarter Final", "2026-07-05T19:00:00.000Z"),
        match("Group C", "2026-06-12T18:00:00.000Z", MatchStatus.FINISHED),
      ],
      now,
    );

    expect(result.map((item) => item.stage)).toEqual(["Group A", "Group B"]);
  });

  it("sorts matches chronologically", () => {
    const result = filterOpenGroupStageMatches(
      [
        match("Group B", "2026-06-13T18:00:00.000Z"),
        match("Group A", "2026-06-12T18:00:00.000Z"),
      ],
      now,
    );

    expect(result.map((item) => item.stage)).toEqual(["Group A", "Group B"]);
  });
});

describe("groupMatchesByDate", () => {
  it("groups matches by calendar day in chronological order", () => {
    const grouped = groupMatchesByDate(
      [
        match("Group B", "2026-06-13T18:00:00.000Z"),
        match("Group A", "2026-06-12T18:00:00.000Z"),
        match("Group A", "2026-06-12T20:00:00.000Z"),
      ],
      now,
    );

    expect(grouped).toHaveLength(2);
    expect(grouped[0].matches).toHaveLength(2);
    expect(grouped[1].matches).toHaveLength(1);
  });
});
