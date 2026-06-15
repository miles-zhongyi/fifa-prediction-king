import { Readable } from "stream";
import { handleApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/auth";
import { createExportArchive } from "@/lib/admin/export-data";

export async function GET(request: Request) {
  try {
    requireAdmin(request);

    const { stream, filename, contentType } = await createExportArchive();

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
