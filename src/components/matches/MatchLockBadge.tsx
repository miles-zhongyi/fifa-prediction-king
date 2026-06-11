import {
  getLockStatusLabel,
  getMatchLockStatus,
  getMatchStatusColor,
} from "@/lib/match-utils";
import type { Match } from "@/types";

type MatchLockBadgeProps = {
  match: Pick<Match, "status" | "startTime">;
};

export function MatchLockBadge({ match }: MatchLockBadgeProps) {
  const lockStatus = getMatchLockStatus(match);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${getMatchStatusColor(lockStatus)}`}
    >
      {getLockStatusLabel(lockStatus)}
    </span>
  );
}
