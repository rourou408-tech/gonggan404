"use client";

import { useEffect, useState } from "react";
import type { Locale } from "./HomeExperience";

type Post = { id:number; title:string; content:string; imageKey:string; createdAt:string };
const mediaUrl = (key:string) => `/api/blog/media/${encodeURIComponent(key.split("/").pop() || "")}`;

export function BlogPreview({ locale }: { locale:Locale }) {
  const [posts,setPosts] = useState<Post[]>([]);
  useEffect(() => { fetch("/api/blog").then((response) => response.ok ? response.json() : null).then((data) => setPosts(data?.posts || [])).catch(() => undefined); }, []);
  return <section className="blog-preview section-pad" id="blog"><div className="section-top"><div className="section-index">02 / BLOG / {locale === "zh" ? "创作博客" : "CREATIVE JOURNAL"}</div><a href="/blog">{locale === "zh" ? "查看全部 / 新建博客" : "ALL POSTS / NEW POST"} →</a></div><h2>{locale === "zh" ? <>正在发生的<br />创作现场。</> : <>IDEAS IN<br />PROGRESS.</>}</h2>{posts.length ? <div className="blog-preview-grid">{posts.slice(0,3).map((post,index) => <article key={post.id}><a href={`/blog/${post.id}`} target="_blank" rel="noreferrer" className={`blog-cover ${post.imageKey ? "" : "blog-cover-text"}`}>{post.imageKey ? <img src={mediaUrl(post.imageKey)} alt={post.title} /> : <b>{post.title}</b>}<span>{String(index+1).padStart(2,"0")}</span></a><div className="blog-preview-copy"><time>{new Date(post.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}</time><h3>{post.title}</h3><p>{post.content.slice(0,50)}{post.content.length > 50 ? "…" : ""}</p></div></article>)}</div> : <a className="blog-empty" href="/blog"><span>＋</span><div><b>{locale === "zh" ? "发布第一篇博客" : "PUBLISH THE FIRST POST"}</b><small>{locale === "zh" ? "上传 3:4 封面，记录标题与创作内容" : "Upload a 3:4 cover, title, and story"}</small></div></a>}</section>;
}
