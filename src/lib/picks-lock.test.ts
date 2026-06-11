import { describe, expect, it } from "vitest";
import {
  getGroupAndThirdPlaceLockTime,
  isGroupAndThirdPlaceLocked,
} from "./picks-lock";

describe("group and third-place lock", () => {
  it("stays open through June 19 Toronto time", () => {
    expect(
      isGroupAndThirdPlaceLocked(new Date("2026-06-19T23:59:59.000Z")),
    ).toBe(false);
  });

  it("locks at the start of June 20 Toronto time", () => {
    const lockTime = getGroupAndThirdPlaceLockTime();
    expect(lockTime.toISOString()).toBe("2026-06-20T04:00:00.000Z");
    expect(isGroupAndThirdPlaceLocked(lockTime)).toBe(true);
  });
});
