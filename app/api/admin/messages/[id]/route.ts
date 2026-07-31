import { env } from "cloudflare:workers";
import { ensureMessageTables } from "../../../../../db/messages";

function authorized(request: Request) { return Boolean(env.ADMIN_ACCESS_KEY) && request.headers.get("x-admin-key") === env.ADMIN_ACCESS_KEY; }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureMessageTables(env.DB);
  const { id } = await params; const { action } = await request.json() as { action?: string };
  const commands: Record<string, string> = { pin: "UPDATE visitor_messages SET is_pinned = 1 WHERE id = ?", unpin: "UPDATE visitor_messages SET is_pinned = 0 WHERE id = ?", publish: "UPDATE visitor_messages SET status = 'published' WHERE id = ?", hide: "UPDATE visitor_messages SET status = 'hidden' WHERE id = ?", delete: "UPDATE visitor_messages SET status = 'deleted', is_pinned = 0 WHERE id = ?" };
  if (!commands[action || ""] || !/^\d+$/.test(id)) return Response.json({ error: "Invalid action" }, { status: 400 });
  await env.DB.prepare(commands[action!]).bind(id).run(); return Response.json({ ok: true });
}
