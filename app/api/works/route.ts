import { env } from "cloudflare:workers";
import { ensureWorksTable } from "../../../db/works";
import { isBlogAdmin } from "../../../db/blog";

export async function GET() {
  await ensureWorksTable(env.DB);
  const result = await env.DB.prepare("SELECT id, title, summary, content, image_key AS imageKey, visual_key AS visualKey, sort_order AS sortOrder, created_at AS createdAt FROM selected_works ORDER BY sort_order ASC, id ASC").all();
  return Response.json({ works:result.results });
}

export async function POST(request:Request) {
  if (!isBlogAdmin(request,env.ADMIN_ACCESS_KEY)) return Response.json({ error:"Unauthorized" },{ status:401 });
  await ensureWorksTable(env.DB);
  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const summary = String(form.get("summary") || "").trim();
  const blockMeta = JSON.parse(String(form.get("blocks") || "[]")) as Array<{ type?:string; imageKey:string; imageType:string; text:string }>;
  if (!title || title.length > 100 || !summary || summary.length > 180 || !Array.isArray(blockMeta) || !blockMeta.length) return Response.json({ error:"Invalid work" },{ status:400 });
  const uploads = blockMeta.map((block) => ({ type:block.type === "text" ? "text" : "image",imageKey:String(block.imageKey || ""),imageType:String(block.imageType || ""),text:String(block.text || "").trim() }));
  if (uploads.some((upload) => upload.text.length > 20000 || (upload.type === "text" ? !upload.text : (!/^works\/[a-z0-9-]+\.[a-z0-9]+$/i.test(upload.imageKey) || !upload.imageType.startsWith("image/"))))) return Response.json({ error:"Invalid content block" },{ status:400 });
  const firstImage = uploads.find((upload) => upload.type === "image");
  const imageKey = firstImage?.imageKey || "";
  const content = uploads.map((upload) => upload.text).filter(Boolean).join("\n\n") || summary;
  try {
    const max = await env.DB.prepare("SELECT COALESCE(MAX(sort_order), -1) AS value FROM selected_works").first<{ value:number }>();
    const createdAt = new Date().toISOString();
    const work = await env.DB.prepare("INSERT INTO selected_works (title, summary, content, image_key, image_type, visual_key, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, title, summary, content, image_key AS imageKey, visual_key AS visualKey, sort_order AS sortOrder, created_at AS createdAt").bind(title,summary,content,imageKey,firstImage?.imageType || "",firstImage ? "custom" : "text",(max?.value ?? -1)+1,createdAt).first<{ id:number }>();
    await env.DB.batch(uploads.map((upload,index) => env.DB.prepare("INSERT INTO work_content_blocks (work_id, image_key, image_type, body_text, sort_order) VALUES (?, ?, ?, ?, ?)").bind(work!.id,upload.imageKey,upload.imageType,upload.text,index)));
    return Response.json({ work },{ status:201 });
  } catch (error) {
    await Promise.all(uploads.filter((upload) => upload.imageKey).map((upload) => env.MEDIA.delete(upload.imageKey)));
    throw error;
  }
}
