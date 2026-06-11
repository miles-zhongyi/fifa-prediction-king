import { buildAvatarSvg } from "@/lib/avatar";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;
  const decoded = decodeURIComponent(username);
  const svg = buildAvatarSvg(decoded);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
