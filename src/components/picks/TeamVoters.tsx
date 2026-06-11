"use client";

import { UserAvatar } from "@/components/users/UserAvatar";

export type TeamVoter = {
  userId: string;
  username: string;
  avatarUrl?: string | null;
};

type TeamVotersProps = {
  voters: TeamVoter[];
  maxVisible?: number;
};

export function TeamVoters({ voters, maxVisible = 6 }: TeamVotersProps) {
  if (voters.length === 0) {
    return <span className="text-xs text-[var(--muted)]">No picks yet</span>;
  }

  const visible = voters.slice(0, maxVisible);
  const overflow = voters.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((voter) => (
        <UserAvatar
          key={voter.userId}
          username={voter.username}
          avatarUrl={voter.avatarUrl}
          size={22}
          title={voter.username}
          className="ring-1 ring-[var(--border)]"
        />
      ))}
      {overflow > 0 && (
        <span className="text-xs text-[var(--muted)]">+{overflow}</span>
      )}
    </div>
  );
}
