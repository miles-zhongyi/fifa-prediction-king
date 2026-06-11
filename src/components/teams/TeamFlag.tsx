"use client";

import { getTeamFlagEmoji } from "@/lib/teams";

type TeamFlagProps = {
  team: string;
  size?: number;
  className?: string;
};

export function TeamFlag({ team, size = 20, className = "" }: TeamFlagProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      style={{ fontSize: size }}
      role="img"
      aria-label={`${team} flag`}
    >
      {getTeamFlagEmoji(team)}
    </span>
  );
}

type TeamNameProps = {
  team: string;
  flagSize?: number;
  className?: string;
};

export function TeamName({ team, flagSize = 20, className = "" }: TeamNameProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <TeamFlag team={team} size={flagSize} />
      <span>{team}</span>
    </span>
  );
}
