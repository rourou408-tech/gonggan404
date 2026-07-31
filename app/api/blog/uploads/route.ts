import { env } from "cloudflare:workers";
import { isBlogAdmin } from "../../../../db/blog";

export async function POST(request: Request) {
  if (!isBlogAdmin(request, env.ADMIN_ACCESS_KEY)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const image = form.get("image");
  if (!(image instanceof File) || !image.type.startsWith("image/") || image.size > 8 * 1024 * 1024) return Response.json({ error: "Invalid image" }, { status: 400 });
  const extension = image.type.split("/")[1]?.replace("jpeg", "jpg").replace(/[^a-z0-9]/gi, "") || "img";
  const imageKey = `blog/${crypto.randomUUID()}.${extension}`;
  await env.MEDIA.put(imageKey, image.stream(), { httpMetadata: { contentType: image.type } });
  return Response.json({ imageKey, imageType: image.type }, { status: 201 });
}
