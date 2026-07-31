import { env } from "cloudflare:workers";
import { ensureBlogTable, isBlogAdmin } from "../../../../db/blog";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureBlogTable(env.DB);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const post = await env.DB.prepare("SELECT id, title, content, image_key AS imageKey, image_type AS imageType, created_at AS createdAt FROM blog_posts WHERE id = ?").bind(id).first();
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  const blocks = await env.DB.prepare("SELECT id, image_key AS imageKey, image_type AS imageType, body_text AS bodyText, sort_order AS sortOrder FROM blog_content_blocks WHERE blog_id = ? ORDER BY sort_order ASC, id ASC").bind(id).all();
  return Response.json({ post: { ...post, blocks: blocks.results } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isBlogAdmin(request, env.ADMIN_ACCESS_KEY)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureBlogTable(env.DB);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const existing = await env.DB.prepare("SELECT image_key AS imageKey, image_type AS imageType FROM blog_posts WHERE id = ?").bind(id).first<{ imageKey: string; imageType: string }>();
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  if (!title || title.length > 100) return Response.json({ error: "Invalid post" }, { status: 400 });

  if (form.has("blocks")) {
    let parsed: Array<{ type?: string; imageKey?: string; imageType?: string; text?: string }>;
    try { parsed = JSON.parse(String(form.get("blocks") || "[]")); }
    catch { return Response.json({ error: "Invalid blocks" }, { status: 400 }); }
    if (!Array.isArray(parsed) || parsed.length > 200) return Response.json({ error: "Invalid blocks" }, { status: 400 });
    const blocks = parsed.map((block) => ({
      type: block.type === "text" ? "text" : "image",
      imageKey: String(block.imageKey || ""),
      imageType: String(block.imageType || ""),
      text: String(block.text || "").trim(),
    }));
    if (blocks.some((block) => block.text.length > 20000 || (block.type === "text" ? !block.text : (!/^blog\/[a-z0-9-]+\.[a-z0-9]+$/i.test(block.imageKey) || !block.imageType.startsWith("image/"))))) return Response.json({ error: "Invalid block" }, { status: 400 });
    const previous = await env.DB.prepare("SELECT image_key AS imageKey FROM blog_content_blocks WHERE blog_id = ?").bind(id).all<{ imageKey: string }>();
    const content = blocks.map((block) => block.text).filter(Boolean).join("\n\n") || title;
    const firstImage = blocks.find((block) => block.type === "image");
    await env.DB.batch([
      env.DB.prepare("UPDATE blog_posts SET title = ?, content = ?, image_key = ?, image_type = ? WHERE id = ?").bind(title, content, firstImage?.imageKey || "", firstImage?.imageType || "", id),
      env.DB.prepare("DELETE FROM blog_content_blocks WHERE blog_id = ?").bind(id),
      ...blocks.map((block, index) => env.DB.prepare("INSERT INTO blog_content_blocks (blog_id, image_key, image_type, body_text, sort_order) VALUES (?, ?, ?, ?, ?)").bind(id, block.imageKey, block.imageType, block.text, index)),
    ]);
    const retained = new Set(blocks.map((block) => block.imageKey).filter(Boolean));
    const oldKeys = new Set([existing.imageKey, ...previous.results.map((block) => block.imageKey)].filter(Boolean));
    await Promise.all([...oldKeys].filter((key) => !retained.has(key)).map((key) => env.MEDIA.delete(key)));
    return Response.json({ ok: true });
  }

  const content = String(form.get("content") || "").trim();
  const image = form.get("image");
  if (!content || content.length > 20000) return Response.json({ error: "Invalid post" }, { status: 400 });
  if (image instanceof File && image.size > 0 && (!image.type.startsWith("image/") || image.size > 8 * 1024 * 1024)) return Response.json({ error: "Invalid image" }, { status: 400 });
  let imageKey = existing.imageKey;
  let imageType = existing.imageType;
  let replacementKey = "";
  if (image instanceof File && image.size > 0) {
    const extension = image.type.split("/")[1]?.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "img";
    replacementKey = `blog/${crypto.randomUUID()}.${extension}`;
    await env.MEDIA.put(replacementKey, image.stream(), { httpMetadata: { contentType: image.type } });
    imageKey = replacementKey;
    imageType = image.type;
  }
  try {
    const post = await env.DB.prepare("UPDATE blog_posts SET title = ?, content = ?, image_key = ?, image_type = ? WHERE id = ? RETURNING id, title, content, image_key AS imageKey, created_at AS createdAt").bind(title, content, imageKey, imageType, id).first();
    const currentBlocks = await env.DB.prepare("SELECT id FROM blog_content_blocks WHERE blog_id = ?").bind(id).all();
    if (!currentBlocks.results.length) await env.DB.prepare("INSERT INTO blog_content_blocks (blog_id, image_key, image_type, body_text, sort_order) VALUES (?, ?, ?, ?, 0)").bind(id, imageKey, imageType, content).run();
    if (replacementKey && existing.imageKey) await env.MEDIA.delete(existing.imageKey);
    return Response.json({ post });
  } catch (error) {
    if (replacementKey) await env.MEDIA.delete(replacementKey);
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isBlogAdmin(request, env.ADMIN_ACCESS_KEY)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureBlogTable(env.DB);
  const { id } = await params;
  if (!/^\d+$/.test(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const post = await env.DB.prepare("SELECT image_key AS imageKey FROM blog_posts WHERE id = ?").bind(id).first<{ imageKey: string }>();
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  const blocks = await env.DB.prepare("SELECT image_key AS imageKey FROM blog_content_blocks WHERE blog_id = ?").bind(id).all<{ imageKey: string }>();
  await env.DB.batch([env.DB.prepare("DELETE FROM blog_content_blocks WHERE blog_id = ?").bind(id), env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id)]);
  const keys = new Set([post.imageKey, ...blocks.results.map((block) => block.imageKey)].filter(Boolean));
  await Promise.all([...keys].map((key) => env.MEDIA.delete(key)));
  return Response.json({ ok: true });
}
