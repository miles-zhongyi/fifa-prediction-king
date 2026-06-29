// Per-round lock times: midnight ET (04:00 UTC) the day before each round's first match.
// This gives players a ~24-hour warning before picks are closed.
const ROUND_LOCK_TIMES: Record<string, Date> = {
  TOP16:  new Date("2026-06-27T04:00:00.000Z"), // locks Jun 27 midnight ET, R32 starts Jun 28
  TOP8:   new Date("2026-07-03T04:00:00.000Z"), // locks Jul 3  midnight ET, R16 starts Jul 4
  TOP4:   new Date("2026-07-08T04:00:00.000Z"), // locks Jul 8  midnight ET, QF  starts Jul 9
  TOP2:   new Date("2026-07-13T04:00:00.000Z"), // locks Jul 13 midnight ET, SF  starts Jul 14
  WINNER: new Date("2026-07-18T04:00:00.000Z"), // locks Jul 18 midnight ET, Final starts Jul 19
};

export function isKnockoutRoundLocked(round: string, now = new Date()): boolean {
  const lockAt = ROUND_LOCK_TIMES[round];
  if (!lockAt) return false;
  return now.getTime() >= lockAt.getTime();
}

// Legacy: returns true if ANY round is locked (used for UI summary).
export async function isKnockoutRoundsLocked(now = new Date()): Promise<boolean> {
  return isKnockoutRoundLocked("TOP16", now);
}
