import { createHash } from "crypto";

const AVATAR_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#6366f1",
];

export function getAvatarInitials(username: string): string {
  const cleaned = username.trim();
  if (!cleaned) {
    return "?";
  }

  return cleaned.slice(0, 2).toUpperCase();
}

export function getAvatarColor(username: string): string {
  const hash = createHash("sha256").update(username).digest();
  const index = hash[0] % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function buildGeneratedAvatarPath(username: string): string {
  return `/api/avatar/${encodeURIComponent(username)}`;
}

export function buildAvatarSvg(username: string): string {
  const initials = getAvatarInitials(username);
  const color = getAvatarColor(username);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${username}">
  <rect width="128" height="128" rx="64" fill="${color}" />
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#0b1220">
    ${initials}
  </text>
</svg>`;
}

export function resolveUserAvatarUrl(
  username: string,
  avatarUrl: string | null | undefined,
): string {
  if (!avatarUrl) {
    return buildGeneratedAvatarPath(username);
  }

  if (avatarUrl.startsWith("/uploads/avatars/")) {
    return avatarUrl.replace(
      "/uploads/avatars/",
      "/api/uploads/avatars/",
    );
  }

  return avatarUrl;
}
