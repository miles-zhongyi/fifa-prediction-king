"use client";

import Image from "next/image";
import { resolveUserAvatarUrl } from "@/lib/avatar";

type UserAvatarProps = {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  title?: string;
};

export function UserAvatar({
  username,
  avatarUrl,
  size = 32,
  className = "",
  title,
}: UserAvatarProps) {
  const src = resolveUserAvatarUrl(username, avatarUrl);

  return (
    <Image
      key={src}
      src={src}
      alt={`${username} avatar`}
      title={title ?? username}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-white/10 ${className}`}
      unoptimized
    />
  );
}

type CorrectPredictorAvatarsProps = {
  predictors: Array<{
    userId: string;
    username: string;
    avatarUrl: string;
  }>;
  maxVisible?: number;
};

export function CorrectPredictorAvatars({
  predictors,
  maxVisible = 8,
}: CorrectPredictorAvatarsProps) {
  if (predictors.length === 0) {
    return null;
  }

  const visible = predictors.slice(0, maxVisible);
  const overflow = predictors.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-[var(--muted)]">Got it right:</span>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map((predictor) => (
          <UserAvatar
            key={predictor.userId}
            username={predictor.username}
            avatarUrl={predictor.avatarUrl}
            size={24}
            title={predictor.username}
            className="ring-1 ring-[var(--border)]"
          />
        ))}
        {overflow > 0 && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[var(--muted)]">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
