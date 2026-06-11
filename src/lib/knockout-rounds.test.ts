import { describe, expect, it } from "vitest";
import { ADVANCING_POOL_SIZE, KNOCKOUT_ROUNDS } from "./knockout-rounds";

describe("knockout rounds", () => {
  it("defines a 32-team pool narrowing to a champion", () => {
    expect(ADVANCING_POOL_SIZE).toBe(32);
    expect(KNOCKOUT_ROUNDS.map((round) => round.maxPicks)).toEqual([
      16, 8, 4, 2, 1,
    ]);
  });
});
