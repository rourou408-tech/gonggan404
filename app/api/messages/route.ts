import { env } from "cloudflare:workers";
import { ensureMessageTables } from "../../../db/messages";

const blocked = /https?:\/\/|博彩|赌博|色情|诈骗|spam/i;
const avatars = ["✦", "○", "◇", "◒", "△"];

function visitorId(request: Request) { return request.headers.get("x-visitor-id") || crypto.randomUUID(); }
function clientHash(value: string) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((b) => Array.from(new Uint8Array(b)).map((n) => n.toString(16).padStart(2, "0")).join("")); }

export async function GET() {
  await ensureMessageTables(env.DB);
  const result = await env.DB.prepare("SELECT id, content, avatar, likes, is_pinned AS isPinned, created_at AS createdAt FROM visitor_messages WHERE status = 'published' ORDER BY is_pinned DESC, likes DESC, created_at DESC").all();
  return Response.json({ messages: result.results });
}

export async function POST(request: Request) {
  await ensureMessageTables(env.DB);
  const payload = await request.json() as { content?: string };
  const content = payload.content?.trim() || "";
  if (!content || content.length > 50 || blocked.test(content)) return Response.json({ error: "Message does not meet submission rules." }, { status: 400 });
  const rawVisitor = visitorId(request);
  const visitorHash = await clientHash(rawVisitor);
  const ipHash = await clientHash(request.headers.get("cf-connecting-ip") || "unknown");
  const createdAt = new Date().toISOString();
  const avatar = avatars[Math.floor(Math.random() * avatars.length)];
  await env.DB.prepare("INSERT INTO visitor_messages (content, avatar, likes, status, is_pinned, created_at, visitor_hash, ip_hash, device_info) VALUES (?, ?, 0, 'pending', 0, ?, ?, ?, ?)").bind(content, avatar, createdAt, visitorHash, ipHash, request.headers.get("user-agent") || "").run();
  return Response.json({ ok: true, visitorId: rawVisitor }, { status: 201 });
}
