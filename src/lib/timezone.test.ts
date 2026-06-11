import { describe, expect, it } from "vitest";
import {
  hasTorontoMatchKickoffStarted,
  isBeforeTorontoMatchKickoff,
} from "./timezone";

describe("Toronto match kickoff locking", () => {
  const kickoff = "2026-06-15T23:00:00.000Z";

  it("stays open until the kickoff instant", () => {
    expect(
      isBeforeTorontoMatchKickoff(
        kickoff,
        new Date("2026-06-15T22:59:59.999Z"),
      ),
    ).toBe(true);
  });

  it("locks at kickoff", () => {
    expect(
      hasTorontoMatchKickoffStarted(kickoff, new Date(kickoff)),
    ).toBe(true);
  });
});
