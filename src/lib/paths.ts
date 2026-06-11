import path from "path";

export function getDataDir(): string {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}

export function getAvatarUploadDir(): string {
  return path.join(getDataDir(), "uploads", "avatars");
}

export function buildAvatarPublicPath(filename: string): string {
  return `/api/uploads/avatars/${filename}`;
}
