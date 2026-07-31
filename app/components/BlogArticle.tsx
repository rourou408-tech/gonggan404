"use client";

import { FormEvent, useEffect, useState } from "react";

type ContentBlock = { id:number; imageKey:string; imageType:string; bodyText:string; sortOrder:number };
type Post = { id:number; title:string; content:string; imageKey:string; imageType:string; createdAt:string; blocks:ContentBlock[] };
type EditBlock = { id:string; imageKey:string; imageType:string; preview:string; text:string; selected:boolean; file?:File };
const mediaUrl = (key:string) => `/api/blog/media/${encodeURIComponent(key.split("/").pop() || "")}`;

async function optimizeImage(file:File) {
  if (file.size <= 7 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1,3000 / Math.max(bitmap.width,bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image optimization failed")),"image/webp",.88));
  return new File([blob],file.name.replace(/\.[^.]+$/,"") + ".webp",{ type:"image/webp" });
}

export function BlogArticle({ id }: { id:string }) {
  const [post,setPost] = useState<Post|null>(null);
  const [missing,setMissing] = useState(false);
  const [owner,setOwner] = useState(false);
  const [editing,setEditing] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState("");
  const [title,setTitle] = useState("");
  const [blocks,setBlocks] = useState<EditBlock[]>([]);
  const [freeText,setFreeText] = useState("");

  const load = () => fetch(`/api/blog/${id}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setPost(data.post));
  useEffect(() => {
    const syncOwner = () => setOwner(Boolean(localStorage.getItem("sankou-owner-key")));
    syncOwner();
    window.addEventListener("sankou-owner-change",syncOwner);
    load().catch(() => setMissing(true));
    return () => window.removeEventListener("sankou-owner-change",syncOwner);
  },[id]);

  function beginEdit() {
    if (!post) return;
    setTitle(post.title);
    setNotice("");
    const source = post.blocks?.length ? post.blocks : [{ id:0,imageKey:post.imageKey,imageType:post.imageType,bodyText:post.content,sortOrder:0 }];
    const existing = source.filter((block) => block.imageKey).map((block) => ({ id:String(block.id),imageKey:block.imageKey,imageType:block.imageType,preview:mediaUrl(block.imageKey),text:block.bodyText,selected:false }));
    setBlocks(existing);
    setFreeText(source.filter((block) => !block.imageKey).map((block) => block.bodyText).filter(Boolean).join("\n\n"));
    setEditing(true);
  }

  function addImages(files:FileList|null) {
    if (!files?.length) return;
    const additions = Array.from(files).filter((file) => file.type.startsWith("image/")).map((file) => ({ id:crypto.randomUUID(),imageKey:"",imageType:file.type,preview:URL.createObjectURL(file),text:"",selected:false,file }));
    setBlocks((current) => [...current,...additions]);
  }

  function deleteSelected() {
    setBlocks((current) => {
      current.filter((block) => block.selected && block.file).forEach((block) => URL.revokeObjectURL(block.preview));
      return current.filter((block) => !block.selected);
    });
  }

  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const adminKey = localStorage.getItem("sankou-owner-key") || "";
    setSaving(true); setNotice("");
    try {
      const normalized = [];
      for (const block of blocks) {
        if (block.file) {
          const image = await optimizeImage(block.file);
          const imageForm = new FormData(); imageForm.append("image",image,image.name);
          const response = await fetch("/api/blog/uploads",{ method:"POST",headers:{ "x-admin-key":adminKey },body:imageForm });
          if (!response.ok) throw new Error();
          const uploaded = await response.json();
          normalized.push({ type:"image",imageKey:uploaded.imageKey,imageType:uploaded.imageType,text:block.text });
        } else normalized.push({ type:block.imageKey ? "image" : "text",imageKey:block.imageKey,imageType:block.imageType,text:block.text });
      }
      if (freeText.trim()) normalized.push({ type:"text",imageKey:"",imageType:"",text:freeText.trim() });
      if (!normalized.length) throw new Error();
      const form = new FormData(); form.set("title",title); form.set("blocks",JSON.stringify(normalized));
      const response = await fetch(`/api/blog/${id}`,{ method:"PATCH",headers:{ "x-admin-key":adminKey },body:form });
      if (!response.ok) throw new Error();
      await load(); setEditing(false);
    } catch { setNotice("保存失败，请重新登录管理员账号，并检查图片。单张图片最大 8MB。"); }
    finally { setSaving(false); }
  }

  if (missing) return <main className="article-page"><a href="/blog">← 返回博客</a><h1>文章不存在</h1></main>;
  if (!post) return <main className="article-page"><p>LOADING / 正在读取</p></main>;

  if (editing) return <main className="article-page blog-edit-page"><header><a href="/blog">← CREATIVE BLOG</a><button type="button" onClick={() => setEditing(false)}>退出编辑</button></header><form className="work-creator work-detail-editor blog-flow-editor" onSubmit={save}>
    <div className="work-creator-heading"><b>EDIT BLOG / 编辑博客</b><span>图片与文字自由编排</span></div>
    <label className="blog-title-field">博客标题<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
    <div className="work-media-editor"><div className="work-media-toolbar"><span>{blocks.filter((block) => block.preview).length} 张图片 / 可直接输入文字</span><button type="button" disabled={!blocks.some((block) => block.selected)} onClick={deleteSelected}>删除所选</button></div>
      {blocks.map((block,index) => <article className={`work-editor-block ${block.selected ? "selected" : ""} ${block.preview ? "" : "text-only"}`} key={block.id}><button className="media-select" type="button" aria-label="选择内容块" onClick={() => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item,selected:!item.selected } : item))}>{block.selected ? "✓" : ""}</button>{block.preview ? <img className="work-live-preview" src={block.preview} alt={`博客图片 ${index+1}`} onClick={() => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item,selected:!item.selected } : item))} /> : <div className="work-text-canvas"><span>TEXT / 文字内容</span></div>}<textarea className="work-inline-copy" value={block.text} placeholder="点击这里，直接输入文字……" onChange={(event) => { const text=event.target.value; setBlocks((current) => current.map((item) => item.id === block.id ? { ...item,text } : item)); }} onInput={(event) => { event.currentTarget.style.height="auto"; event.currentTarget.style.height=`${event.currentTarget.scrollHeight}px`; }} /></article>)}
      <label className="work-free-copy"><span>文字内容</span><textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} maxLength={20000} placeholder="即使不添加图片，也可以直接在这里输入文字……" /></label>
      <div className="work-add-controls single"><label className="work-image-upload"><span>＋ 添加图片</span><small>可连续添加，不限制张数 · 单张 8MB MAX</small><input type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); event.currentTarget.value=""; }} /></label></div>
    </div><button disabled={saving}>{saving ? "保存中…" : "保存博客"}</button>{notice && <p>{notice}</p>}
  </form></main>;

  const displayBlocks = post.blocks?.length ? post.blocks : [{ id:0,imageKey:post.imageKey,imageType:post.imageType,bodyText:post.content,sortOrder:0 }];
  return <main className="article-page"><header><a href="/blog">← 返回博客</a><a href="/">SANKOU LEE</a>{owner && <button type="button" onClick={beginEdit}>编辑博客</button>}</header><article><div className="article-meta"><span>BLOG / {String(post.id).padStart(3,"0")}</span><time>{new Date(post.createdAt).toLocaleDateString("zh-CN")}</time></div><h1>{post.title}</h1><div className="blog-story-stream">{displayBlocks.map((block,index) => <section className={block.imageKey ? "" : "text-only"} key={block.id || index}>{block.imageKey && <img src={mediaUrl(block.imageKey)} alt={`${post.title} ${index+1}`} />}{block.bodyText && <div className="article-copy">{block.bodyText.split(/\n+/).map((paragraph,paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>}</section>)}</div></article></main>;
}
