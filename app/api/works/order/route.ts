import { env } from "cloudflare:workers";
import { ensureWorksTable } from "../../../../db/works";
import { isBlogAdmin } from "../../../../db/blog";

export async function PATCH(request:Request) {
  if (!isBlogAdmin(request,env.ADMIN_ACCESS_KEY)) return Response.json({ error:"Unauthorized" },{ status:401 });
  await ensureWorksTable(env.DB);
  const body = await request.json().catch(() => null) as { ids?:unknown } | null;
  if (!Array.isArray(body?.ids) || !body.ids.every((id) => Number.isInteger(id))) return Response.json({ error:"Invalid order" },{ status:400 });
  await env.DB.batch(body.ids.map((id,index) => env.DB.prepare("UPDATE selected_works SET sort_order = ? WHERE id = ?").bind(index,id)));
  return Response.json({ ok:true });
}
