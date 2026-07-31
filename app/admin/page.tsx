"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AdminMessage = { id:number; content:string; likes:number; createdAt:string; status:string; isPinned:number; ipHash:string; deviceInfo:string };
type Filter = "all" | "pinned" | "popular" | "pending" | "deleted";

const filters: { key:Filter; label:string }[] = [
  { key:"all", label:"全部留言" }, { key:"pinned", label:"已置顶" }, { key:"popular", label:"高赞留言" }, { key:"pending", label:"未查看" }, { key:"deleted", label:"已删除" },
];

export default function AdminPage() {
  const [key,setKey] = useState(""); const [messages,setMessages] = useState<AdminMessage[]>([]); const [error,setError] = useState(""); const [filter,setFilter] = useState<Filter>("all"); const [loading,setLoading] = useState(false);
  const visible = useMemo(() => messages.filter((m) => filter === "all" || (filter === "pinned" && m.isPinned) || (filter === "popular" && m.likes >= 20) || (filter === "pending" && m.status === "pending") || (filter === "deleted" && m.status === "deleted")), [messages,filter]);
  async function load(event?: FormEvent) { event?.preventDefault(); setLoading(true); setError(""); try { const response = await fetch("/api/admin/messages", { headers:{ "x-admin-key":key } }); if (!response.ok) throw new Error(); const data = await response.json(); setMessages(data.messages); } catch { setError("访问被拒绝。请使用 Sankou Lee 的管理员密钥。"); } finally { setLoading(false); } }
  useEffect(() => { const saved=localStorage.getItem("sankou-owner-key") || ""; if (!saved) return; setKey(saved); setLoading(true); fetch("/api/admin/messages",{ headers:{ "x-admin-key":saved } }).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setMessages(data.messages)).catch(() => setError("管理员登录已失效，请返回首页重新登录。")).finally(() => setLoading(false)); },[]);
  async function update(id:number,action:string) { const response = await fetch(`/api/admin/messages/${id}`, { method:"PATCH", headers:{ "content-type":"application/json", "x-admin-key":key }, body:JSON.stringify({ action }) }); if (response.ok) await load(); }
  return <main className="admin-page">
    <a href="/" className="back">← 返回网站</a><div className="eyebrow">VISITOR MESSAGE MANAGEMENT</div><h1>留言管理</h1>
    <form onSubmit={load}><input type="password" placeholder="管理员密钥" value={key} onChange={(event) => setKey(event.target.value)} /><button disabled={loading}>{loading ? "读取中…" : "进入管理"}</button></form>{error && <p className="admin-error">{error}</p>}
    <div className="admin-tabs">{filters.map((item) => <button className={filter === item.key ? "active" : ""} onClick={() => setFilter(item.key)} key={item.key}>{item.label}<b>{item.key === "all" ? messages.length : ""}</b></button>)}</div>
    <div className="admin-list">{visible.length === 0 && <p className="admin-empty">当前分类暂无留言</p>}{visible.map((m) => <article key={m.id}><div><p>{m.content}</p><em>{m.isPinned ? "已置顶" : m.status === "published" ? "已公开" : m.status === "pending" ? "待审核" : m.status === "hidden" ? "已隐藏" : "已删除"}</em></div><small>♥ {m.likes}<br />{new Date(m.createdAt).toLocaleString("zh-CN")}<br />IP {m.ipHash?.slice(0,8) || "-"}</small><div><button onClick={() => update(m.id,m.isPinned ? "unpin" : "pin")}>{m.isPinned ? "取消置顶" : "置顶"}</button><button onClick={() => update(m.id,m.status === "published" ? "hide" : "publish")}>{m.status === "published" ? "隐藏" : "公开"}</button><button onClick={() => update(m.id,"delete")}>删除</button></div></article>)}</div>
  </main>;
}
