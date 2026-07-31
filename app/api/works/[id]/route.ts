import { env } from "cloudflare:workers";
import { ensureWorksTable } from "../../../../db/works";
import { isBlogAdmin } from "../../../../db/blog";

export async function GET(_request:Request,{ params }:{ params:Promise<{ id:string }> }) {
  await ensureWorksTable(env.DB);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error:"Invalid id" },{ status:400 });
  const work = await env.DB.prepare("SELECT id, title, summary, content, image_key AS imageKey, image_type AS imageType, visual_key AS visualKey, sort_order AS sortOrder, created_at AS createdAt FROM selected_works WHERE id = ?").bind(id).first();
  if (!work) return Response.json({ error:"Not found" },{ status:404 });
  const blocks = await env.DB.prepare("SELECT id, image_key AS imageKey, image_type AS imageType, body_text AS bodyText, sort_order AS sortOrder FROM work_content_blocks WHERE work_id = ? ORDER BY sort_order ASC, id ASC").bind(id).all();
  return Response.json({ work:{ ...work,blocks:blocks.results } });
}

export async function PATCH(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
  if (!isBlogAdmin(request,env.ADMIN_ACCESS_KEY)) return Response.json({ error:"Unauthorized" },{ status:401 });
  await ensureWorksTable(env.DB);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error:"Invalid id" },{ status:400 });
  const existing = await env.DB.prepare("SELECT id FROM selected_works WHERE id = ?").bind(id).first();
  if (!existing) return Response.json({ error:"Not found" },{ status:404 });
  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const summary = String(form.get("summary") || "").trim();
  const blocks = JSON.parse(String(form.get("blocks") || "[]")) as Array<{ type?:string; imageKey:string; imageType:string; text:string }>;
  if (!title || title.length > 100 || !summary || summary.length > 180 || !Array.isArray(blocks)) return Response.json({ error:"Invalid work" },{ status:400 });
  const normalized = blocks.map((block) => ({ type:block.type === "text" ? "text" : "image",imageKey:String(block.imageKey || ""),imageType:String(block.imageType || ""),text:String(block.text || "").trim() }));
  if (normalized.some((block) => block.text.length > 20000 || (block.type === "text" ? !block.text : (!/^works\/[a-z0-9-]+\.[a-z0-9]+$/i.test(block.imageKey) || !block.imageType.startsWith("image/"))))) return Response.json({ error:"Invalid block" },{ status:400 });
  const previous = await env.DB.prepare("SELECT image_key AS imageKey FROM work_content_blocks WHERE work_id = ?").bind(id).all<{ imageKey:string }>();
  const content = normalized.map((block) => block.text).filter(Boolean).join("\n\n") || summary;
  const firstImage = normalized.find((block) => block.type === "image");
  const statements = [
    env.DB.prepare("UPDATE selected_works SET title = ?, summary = ?, content = ?, image_key = ?, image_type = ?, visual_key = ? WHERE id = ?").bind(title,summary,content,firstImage?.imageKey || "",firstImage?.imageType || "",firstImage ? "custom" : "text",id),
    env.DB.prepare("DELETE FROM work_content_blocks WHERE work_id = ?").bind(id),
    ...normalized.map((block,index) => env.DB.prepare("INSERT INTO work_content_blocks (work_id, image_key, image_type, body_text, sort_order) VALUES (?, ?, ?, ?, ?)").bind(id,block.imageKey,block.imageType,block.text,index)),
  ];
  await env.DB.batch(statements);
  const retained = new Set(normalized.map((block) => block.imageKey));
  await Promise.all(previous.results.filter((block) => !retained.has(block.imageKey)).map((block) => env.MEDIA.delete(block.imageKey)));
  return Response.json({ ok:true });
}

export async function DELETE(request:Request,{ params }:{ params:Promise<{ id:string }> }) {
  if (!isBlogAdmin(request,env.ADMIN_ACCESS_KEY)) return Response.json({ error:"Unauthorized" },{ status:401 });
  await ensureWorksTable(env.DB);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error:"Invalid id" },{ status:400 });
  const work = await env.DB.prepare("SELECT image_key AS imageKey FROM selected_works WHERE id = ?").bind(id).first<{ imageKey:string }>();
  if (!work) return Response.json({ error:"Not found" },{ status:404 });
  const blocks = await env.DB.prepare("SELECT image_key AS imageKey FROM work_content_blocks WHERE work_id = ?").bind(id).all<{ imageKey:string }>();
  await env.DB.batch([env.DB.prepare("DELETE FROM work_content_blocks WHERE work_id = ?").bind(id),env.DB.prepare("DELETE FROM selected_works WHERE id = ?").bind(id)]);
  const keys = new Set([work.imageKey,...blocks.results.map((block) => block.imageKey)].filter(Boolean));
  await Promise.all([...keys].map((key) => env.MEDIA.delete(key)));
  return Response.json({ ok:true });
}
