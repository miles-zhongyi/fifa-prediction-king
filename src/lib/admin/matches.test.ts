import { MatchStatus, type Match } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeAdminMatch, updateAdminMatch } from "./matches";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    match: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const baseMatch: Match = {
  id: "match-1",
  homeTeam: "Brazil",
  awayTeam: "Argentina",
  stage: "Group A",
  startTime: new Date("2026-06-15T18:00:00.000Z"),
  winner: null,
  status: MatchStatus.SCHEDULED,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("completeAdminMatch", () => {
  beforeEach(() => {
    vi.mocked(prisma.match.findUnique).mockReset();
    vi.mocked(prisma.match.update).mockReset();
  });

  it("sets the winner and marks the match as finished", async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(baseMatch);
    vi.mocked(prisma.match.update).mockResolvedValue({
      ...baseMatch,
      winner: "Brazil",
      status: MatchStatus.FINISHED,
    });

    const result = await completeAdminMatch("match-1", { winner: "Brazil" });

    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: "match-1" },
      data: {
        winner: "Brazil",
        status: MatchStatus.FINISHED,
      },
    });
    expect(result.status).toBe(MatchStatus.FINISHED);
  });

  it("rejects winners that are not one of the teams", async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(baseMatch);

    await expect(
      completeAdminMatch("match-1", { winner: "France" }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/must be either/),
      statusCode: 400,
    });
  });
});

describe("updateAdminMatch", () => {
  beforeEach(() => {
    vi.mocked(prisma.match.findUnique).mockReset();
    vi.mocked(prisma.match.update).mockReset();
  });

  it("requires a winner when status is finished", async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(baseMatch);

    await expect(
      updateAdminMatch("match-1", { status: MatchStatus.FINISHED }),
    ).rejects.toMatchObject({
      message: "Winner is required when a match is marked as completed",
      statusCode: 400,
    });
  });

  it("updates match details when validation passes", async () => {
    vi.mocked(prisma.match.findUnique).mockResolvedValue(baseMatch);
    vi.mocked(prisma.match.update).mockResolvedValue({
      ...baseMatch,
      stage: "Quarter Final",
    });

    const result = await updateAdminMatch("match-1", {
      stage: "Quarter Final",
    });

    expect(result.stage).toBe("Quarter Final");
  });
});
