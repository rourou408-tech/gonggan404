import { env } from "cloudflare:workers";
import { ensureBlogTable, isBlogAdmin } from "../../../db/blog";

export async function GET() {
  await ensureBlogTable(env.DB);
  const result = await env.DB.prepare("SELECT id, title, content, image_key AS imageKey, created_at AS createdAt FROM blog_posts ORDER BY created_at DESC, id DESC").all();
  return Response.json({ posts: result.results });
}

export async function POST(request: Request) {
  if (!isBlogAdmin(request, env.ADMIN_ACCESS_KEY)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureBlogTable(env.DB);
  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  if (form.has("blocks")) {
    let parsed:Array<{ type?:string; imageKey?:string; imageType?:string; text?:string }>;
    try { parsed=JSON.parse(String(form.get("blocks") || "[]")); }
    catch { return Response.json({ error:"Invalid blocks" },{ status:400 }); }
    if (!title || title.length > 100 || !Array.isArray(parsed) || !parsed.length || parsed.length > 200) return Response.json({ error:"Invalid post" },{ status:400 });
    const blocks=parsed.map((block) => ({ type:block.type === "text" ? "text" : "image",imageKey:String(block.imageKey || ""),imageType:String(block.imageType || ""),text:String(block.text || "").trim() }));
    if (blocks.some((block) => block.text.length > 20000 || (block.type === "text" ? !block.text : (!/^blog\/[a-z0-9-]+\.[a-z0-9]+$/i.test(block.imageKey) || !block.imageType.startsWith("image/"))))) return Response.json({ error:"Invalid block" },{ status:400 });
    const content=blocks.map((block) => block.text).filter(Boolean).join("\n\n") || title;
    const createdAt=new Date().toISOString();
    const firstImage=blocks.find((block) => block.type === "image");
    try {
      const post=await env.DB.prepare("INSERT INTO blog_posts (title, content, image_key, image_type, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id, title, content, image_key AS imageKey, created_at AS createdAt").bind(title,content,firstImage?.imageKey || "",firstImage?.imageType || "",createdAt).first<{ id:number }>();
      await env.DB.batch(blocks.map((block,index) => env.DB.prepare("INSERT INTO blog_content_blocks (blog_id, image_key, image_type, body_text, sort_order) VALUES (?, ?, ?, ?, ?)").bind(post!.id,block.imageKey,block.imageType,block.text,index)));
      return Response.json({ post },{ status:201 });
    } catch (error) {
      await Promise.all(blocks.filter((block) => block.imageKey).map((block) => env.MEDIA.delete(block.imageKey)));
      throw error;
    }
  }
  const content = String(form.get("content") || "").trim();
  const image = form.get("image");
  if (!title || title.length > 100 || !content || content.length > 20000 || !(image instanceof File)) return Response.json({ error: "Invalid post" }, { status: 400 });
  if (!image.type.startsWith("image/") || image.size > 8 * 1024 * 1024) return Response.json({ error: "Invalid image" }, { status: 400 });
  const extension = image.type.split("/")[1]?.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "img";
  const imageKey = `blog/${crypto.randomUUID()}.${extension}`;
  await env.MEDIA.put(imageKey, image.stream(), { httpMetadata: { contentType: image.type } });
  try {
    const createdAt = new Date().toISOString();
    const result = await env.DB.prepare("INSERT INTO blog_posts (title, content, image_key, image_type, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id, title, content, image_key AS imageKey, created_at AS createdAt").bind(title, content, imageKey, image.type, createdAt).first<{ id:number; title:string; content:string; imageKey:string; createdAt:string }>();
    await env.DB.prepare("INSERT INTO blog_content_blocks (blog_id, image_key, image_type, body_text, sort_order) VALUES (?, ?, ?, ?, 0)").bind(result?.id, imageKey, image.type, content).run();
    return Response.json({ post: result }, { status: 201 });
  } catch (error) {
    await env.MEDIA.delete(imageKey);
    throw error;
  }
}
