import { env } from "cloudflare:workers";
import { ensureMessageTables } from "../../../../../db/messages";

async function digest(value: string) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(b)).map((n) => n.toString(16).padStart(2, "0")).join(""); }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureMessageTables(env.DB);
  const { id } = await params;
  const visitor = request.headers.get("x-visitor-id") || "";
  if (!visitor || !/^\d+$/.test(id)) return Response.json({ error: "Invalid like." }, { status: 400 });
  const hash = await digest(visitor);
  const existing = await env.DB.prepare("SELECT id FROM message_likes WHERE message_id = ? AND visitor_hash = ?").bind(id, hash).first();
  if (existing) return Response.json({ error: "Already liked." }, { status: 409 });
  await env.DB.batch([env.DB.prepare("INSERT INTO message_likes (message_id, visitor_hash, created_at) VALUES (?, ?, ?)").bind(id, hash, new Date().toISOString()), env.DB.prepare("UPDATE visitor_messages SET likes = likes + 1 WHERE id = ? AND status = 'published'").bind(id)]);
  const message = await env.DB.prepare("SELECT likes FROM visitor_messages WHERE id = ?").bind(id).first();
  return Response.json({ likes: message?.likes ?? 0 });
}
