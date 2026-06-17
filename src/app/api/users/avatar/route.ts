import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  buildAvatarPublicPath,
  getAvatarUploadDir,
} from "@/lib/paths";
import { errorResponse, handleApiError, jsonResponse } from "@/lib/api";
import { schedulePersistGameData } from "@/lib/persistence/schedule-persist";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function removePreviousAvatars(uploadsDir: string, userId: string) {
  const entries = await readdir(uploadsDir).catch(() => [] as string[]);

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(`${userId}.`) || entry.startsWith(`${userId}-`))
      .map((entry) => unlink(path.join(uploadsDir, entry)).catch(() => undefined)),
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const username = String(formData.get("username") ?? "").trim();
    const file = formData.get("file");

    if (!username) {
      return errorResponse("Username is required", 400);
    }

    if (!(file instanceof File)) {
      return errorResponse("Image file is required", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse("Only JPEG, PNG, and WebP images are allowed", 400);
    }

    if (file.size > MAX_BYTES) {
      return errorResponse("Image must be 2MB or smaller", 400);
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return errorResponse("User not found", 404);
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

    const uploadsDir = getAvatarUploadDir();
    await mkdir(uploadsDir, { recursive: true });

    await removePreviousAvatars(uploadsDir, user.id);

    const filename = `${user.id}-${Date.now()}.${extension}`;
    const diskPath = path.join(uploadsDir, filename);
    const publicPath = buildAvatarPublicPath(filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, buffer);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: publicPath },
    });

    schedulePersistGameData();

    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
