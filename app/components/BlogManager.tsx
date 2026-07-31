"use client";

import { FormEvent, useEffect, useState } from "react";

type Post = { id:number; title:string; content:string; imageKey:string; createdAt:string };
type EditBlock = { id:string; file:File; preview:string; text:string; selected:boolean };
const mediaUrl = (key:string) => `/api/blog/media/${encodeURIComponent(key.split("/").pop() || "")}`;

async function optimizeImage(file:File) {
  if (file.size <= 7 * 1024 * 1024) return file;
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,3000 / Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(bitmap.width*scale); canvas.height=Math.round(bitmap.height*scale);
  canvas.getContext("2d")?.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  const blob=await new Promise<Blob>((resolve,reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image optimization failed")),"image/webp",.88));
  return new File([blob],file.name.replace(/\.[^.]+$/,"")+".webp",{ type:"image/webp" });
}

export function BlogManager() {
  const [posts,setPosts]=useState<Post[]>([]);
  const [key,setKey]=useState("");
  const [owner,setOwner]=useState(false);
  const [title,setTitle]=useState("");
  const [blocks,setBlocks]=useState<EditBlock[]>([]);
  const [freeText,setFreeText]=useState("");
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);

  const load=() => fetch("/api/blog").then((response) => response.json()).then((data) => setPosts(data.posts || []));
  useEffect(() => {
    const syncOwner=async () => {
      const saved=localStorage.getItem("sankou-owner-key") || "";
      setKey(saved);
      if (!saved) { setOwner(false); return; }
      const response=await fetch("/api/admin/messages",{ headers:{ "x-admin-key":saved } });
      setOwner(response.ok);
      if (!response.ok) localStorage.removeItem("sankou-owner-key");
    };
    syncOwner().catch(() => setOwner(false));
    window.addEventListener("sankou-owner-change",syncOwner);
    load().catch(() => undefined);
    return () => window.removeEventListener("sankou-owner-change",syncOwner);
  },[]);

  function addImages(files:FileList|null) {
    if (!files?.length) return;
    const additions=Array.from(files).filter((file) => file.type.startsWith("image/")).map((file) => ({ id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),text:"",selected:false }));
    setBlocks((current) => [...current,...additions]);
  }

  function deleteSelected() {
    setBlocks((current) => {
      current.filter((block) => block.selected).forEach((block) => URL.revokeObjectURL(block.preview));
      return current.filter((block) => !block.selected);
    });
  }

  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!blocks.length && !freeText.trim()) return setError("请输入文字或至少添加一张图片。");
    setSaving(true);
    try {
      const uploaded=[];
      for (const block of blocks) {
        const image=await optimizeImage(block.file);
        const imageForm=new FormData(); imageForm.append("image",image,image.name);
        const uploadResponse=await fetch("/api/blog/uploads",{ method:"POST",headers:{ "x-admin-key":key },body:imageForm });
        if (!uploadResponse.ok) throw new Error("upload");
        const upload=await uploadResponse.json();
        uploaded.push({ type:"image",imageKey:upload.imageKey,imageType:upload.imageType,text:block.text });
      }
      if (freeText.trim()) uploaded.push({ type:"text",imageKey:"",imageType:"",text:freeText.trim() });
      const form=new FormData(); form.set("title",title); form.set("blocks",JSON.stringify(uploaded));
      const response=await fetch("/api/blog",{ method:"POST",headers:{ "x-admin-key":key },body:form });
      if (!response.ok) throw new Error("publish");
      blocks.forEach((block) => URL.revokeObjectURL(block.preview));
      setBlocks([]); setTitle(""); setFreeText(""); await load();
    } catch { setError("发布失败，请重新登录管理员账号并检查图片。单张图片最大 8MB。"); }
    finally { setSaving(false); }
  }

  async function remove(id:number) {
    if (!confirm("确认删除这篇博客？")) return;
    const response=await fetch(`/api/blog/${id}`,{ method:"DELETE",headers:{ "x-admin-key":key } });
    if (response.ok) setPosts((current) => current.filter((post) => post.id !== id));
  }

  return <main className="blog-page">
    <header className="blog-page-header"><a href="/">← SANKOU LEE</a><span>CREATIVE BLOG / 创作博客</span></header>
    <section className="blog-page-hero"><p>IDEAS / PROCESS / NOTES</p><h1>创作不只展示<br />结果，也记录过程。</h1></section>
    <section className="owner-panel">{!owner ? <div className="owner-login-note"><b>OWNER MODE / 管理员模式</b><p>请先返回首页，在导航栏右上角完成管理员登录。</p><a href="/">返回首页登录 →</a></div> : <form className="work-creator blog-create-flow" onSubmit={create}>
      <div className="work-creator-heading"><b>NEW BLOG / 新建博客</b><span>连续添加图片，并在图片下方输入文字</span></div>
      <label className="blog-title-field">博客标题<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="输入博客标题" required /></label>
      <div className="work-media-editor"><div className="work-media-toolbar"><span>{blocks.length} 张图片</span><button type="button" disabled={!blocks.some((block) => block.selected)} onClick={deleteSelected}>删除所选</button></div>
        {blocks.map((block,index) => <article className={`work-editor-block ${block.selected ? "selected" : ""}`} key={block.id}><button className="media-select" type="button" aria-label={`选择第 ${index+1} 张图片`} onClick={() => setBlocks((current) => current.map((item) => item.id===block.id ? { ...item,selected:!item.selected } : item))}>{block.selected ? "✓" : ""}</button><img className="work-live-preview" src={block.preview} alt={`博客图片预览 ${index+1}`} onClick={() => setBlocks((current) => current.map((item) => item.id===block.id ? { ...item,selected:!item.selected } : item))} /><textarea className="work-inline-copy" value={block.text} placeholder="点击这里，直接在图片下方输入文字……" onChange={(event) => { const text=event.target.value; setBlocks((current) => current.map((item) => item.id===block.id ? { ...item,text } : item)); }} onInput={(event) => { event.currentTarget.style.height="auto"; event.currentTarget.style.height=`${event.currentTarget.scrollHeight}px`; }} /></article>)}
        <label className="work-free-copy"><span>文字内容</span><textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} maxLength={20000} placeholder="即使不添加图片，也可以直接在这里输入文字……" /></label>
        <div className="work-add-controls single"><label className="work-image-upload"><span>＋ 添加图片</span><small>可连续添加，不限制张数 · 单张 8MB MAX</small><input type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); event.currentTarget.value=""; }} /></label></div>
      </div><button disabled={saving}>{saving ? "发布中…" : "发布博客"}</button>{error && <p>{error}</p>}
    </form>}</section>
    <section className="blog-library"><div className="section-index">ALL POSTS / 全部博客</div><div className="blog-library-grid">{posts.map((post) => <article key={post.id}><a href={`/blog/${post.id}`}><>{post.imageKey ? <img src={mediaUrl(post.imageKey)} alt={post.title} /> : <span className="blog-list-text-cover">{post.title}</span>}</></a><div><time>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</time><h2>{post.title}</h2><p>{post.content.slice(0,60)}{post.content.length>60?"…":""}</p>{owner && <div className="post-actions"><a href={`/blog/${post.id}`}>打开 / 编辑</a><button onClick={() => remove(post.id)}>删除</button></div>}</div></article>)}</div></section>
  </main>;
}
