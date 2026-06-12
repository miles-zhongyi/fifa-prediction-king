"use client";

import { UserAvatar } from "@/components/users/UserAvatar";
import type { AdvanceVoter } from "@/types";

type AdvanceVotersProps = {
  label: string;
  voters: AdvanceVoter[];
  maxVisible?: number;
};

function outcomeRing(outcome: AdvanceVoter["outcome"]): string {
  switch (outcome) {
    case "correct":
      return "ring-2 ring-emerald-400";
    case "incorrect":
      return "ring-2 ring-red-400";
    default:
      return "ring-1 ring-[var(--border)]";
  }
}

function outcomeLabel(outcome: AdvanceVoter["outcome"]): string {
  switch (outcome) {
    case "correct":
      return "Advanced";
    case "incorrect":
      return "Eliminated";
    default:
      return "Pending";
  }
}

export function AdvanceVoters({
  label,
  voters,
  maxVisible = 8,
}: AdvanceVotersProps) {
  if (voters.length === 0) {
    return (
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
        <span className="text-xs text-[var(--muted)]">No advance picks</span>
      </div>
    );
  }

  const visible = voters.slice(0, maxVisible);
  const overflow = voters.length - visible.length;

  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((voter) => (
          <div
            key={voter.userId}
            className="flex items-center gap-1"
            title={`${voter.username} — ${outcomeLabel(voter.outcome)}`}
          >
            <UserAvatar
              username={voter.username}
              avatarUrl={voter.avatarUrl}
              size={24}
              className={outcomeRing(voter.outcome)}
            />
            {voter.outcome === "correct" && (
              <span className="text-xs text-emerald-400">✓</span>
            )}
            {voter.outcome === "incorrect" && (
              <span className="text-xs text-red-400">✗</span>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <span className="text-xs text-[var(--muted)]">+{overflow}</span>
        )}
      </div>
    </div>
  );
}
