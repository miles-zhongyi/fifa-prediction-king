import { readFile } from "fs/promises";
import path from "path";
import { getAvatarUploadDir } from "@/lib/paths";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const safeName = path.basename(filename);

  if (!safeName || safeName !== filename) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(getAvatarUploadDir(), safeName);

  try {
    const buffer = await readFile(filePath);
    const extension = path.extname(safeName).toLowerCase();

    return new Response(buffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "private, no-cache, must-revalidate",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
