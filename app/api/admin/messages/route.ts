import { env } from "cloudflare:workers";
import { ensureMessageTables } from "../../../../db/messages";

function authorized(request: Request) { return Boolean(env.ADMIN_ACCESS_KEY) && request.headers.get("x-admin-key") === env.ADMIN_ACCESS_KEY; }
export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureMessageTables(env.DB);
  const result = await env.DB.prepare("SELECT id, content, likes, status, is_pinned AS isPinned, created_at AS createdAt, ip_hash AS ipHash, device_info AS deviceInfo FROM visitor_messages ORDER BY is_pinned DESC, likes DESC, created_at DESC").all();
  return Response.json({ messages: result.results });
}
