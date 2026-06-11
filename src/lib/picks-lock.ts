/**
 * Group advancer and third-place picks use a fixed deadline (not per-match):
 * open through June 19, 2026 Toronto time, then lock at midnight June 20.
 */
const GROUP_PICKS_LOCK_AT = new Date("2026-06-20T04:00:00.000Z");

export function getGroupAndThirdPlaceLockTime(): Date {
  return GROUP_PICKS_LOCK_AT;
}

export function isGroupAndThirdPlaceLocked(now = new Date()): boolean {
  return now.getTime() >= GROUP_PICKS_LOCK_AT.getTime();
}
