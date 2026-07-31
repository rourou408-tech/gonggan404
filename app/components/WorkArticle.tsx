"use client";

import { FormEvent,useEffect,useState } from "react";
import type { Work } from "./SelectedWorks";

type EditBlock = { id:string; imageKey:string; imageType:string; preview:string; text:string; selected:boolean; file?:File };
const mediaUrl = (key:string) => `/api/works/media/${encodeURIComponent(key.split("/").pop() || "")}`;

async function optimizeImage(file:File) {
  if (file.size <= 7 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1,3000 / Math.max(bitmap.width,bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image optimization failed")),"image/webp",.88));
  return new File([blob],file.name.replace(/\.[^.]+$/,"") + ".webp",{ type:"image/webp" });
}

export function WorkArticle({ id }:{ id:string }) {
  const [work,setWork] = useState<Work | null>(null);
  const [missing,setMissing] = useState(false);
  const [editing,setEditing] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState("");
  const [adminKey,setAdminKey] = useState("");
  const [title,setTitle] = useState("");
  const [summary,setSummary] = useState("");
  const [blocks,setBlocks] = useState<EditBlock[]>([]);
  const [freeText,setFreeText] = useState("");

  const load = () => fetch(`/api/works/${id}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setWork(data.work));
  useEffect(() => { load().catch(() => setMissing(true)); },[id]);

  function beginEdit() {
    if (!work) return;
    setAdminKey(localStorage.getItem("sankou-owner-key") || "");
    setTitle(work.title); setSummary(work.summary); setNotice("");
    const source = work.blocks?.length ? work.blocks : [{ id:0,imageKey:work.imageKey,imageType:work.imageType || "image/jpeg",bodyText:work.content || "",sortOrder:0 }];
    setBlocks(source.filter((block) => block.imageKey).map((block) => ({ id:String(block.id),imageKey:block.imageKey,imageType:block.imageType,preview:mediaUrl(block.imageKey),text:block.bodyText,selected:false })));
    setFreeText(source.filter((block) => !block.imageKey).map((block) => block.bodyText).filter(Boolean).join("\n\n"));
    setEditing(true);
  }

  function addImages(files:FileList | null) {
    if (!files?.length) return;
    const additions = Array.from(files).filter((file) => file.type.startsWith("image/")).map((file) => ({ id:crypto.randomUUID(),imageKey:"",imageType:file.type,preview:URL.createObjectURL(file),text:"",selected:false,file }));
    setBlocks((current) => [...current,...additions]);
  }

  function deleteSelected() {
    setBlocks((current) => { current.filter((block) => block.selected && block.file).forEach((block) => URL.revokeObjectURL(block.preview)); return current.filter((block) => !block.selected); });
  }

  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      const normalized = [];
      for (const block of blocks) {
        if (block.file) {
          const image = await optimizeImage(block.file);
          const imageForm = new FormData(); imageForm.append("image",image,image.name);
          const response = await fetch("/api/works/uploads",{ method:"POST",headers:{ "x-admin-key":adminKey },body:imageForm });
          if (!response.ok) throw new Error();
          const uploaded = await response.json();
          normalized.push({ type:"image",imageKey:uploaded.imageKey,imageType:uploaded.imageType,text:block.text });
        } else normalized.push({ type:block.imageKey ? "image" : "text",imageKey:block.imageKey,imageType:block.imageType,text:block.text });
      }
      if (freeText.trim()) normalized.push({ type:"text",imageKey:"",imageType:"",text:freeText.trim() });
      if (!normalized.length) throw new Error();
      const form = new FormData(); form.set("title",title); form.set("summary",summary); form.set("blocks",JSON.stringify(normalized));
      const response = await fetch(`/api/works/${id}`,{ method:"PATCH",headers:{ "x-admin-key":adminKey },body:form });
      if (!response.ok) throw new Error();
      localStorage.setItem("sankou-owner-key",adminKey); await load(); setEditing(false);
    } catch { setNotice("保存失败，请检查管理员密钥与图片。单张图片最大 8MB。"); }
    finally { setSaving(false); }
  }

  if (missing) return <main className="work-page work-missing"><a href="/#selected">← 返回精选作品</a><h1>案例不存在</h1></main>;
  if (!work) return <main className="work-page work-loading">LOADING CASE…</main>;
  const media = work.imageKey ? mediaUrl(work.imageKey) : "";

  if (editing) return <main className="work-page"><header><a href="/#selected">← SELECTED WORKS</a><button onClick={() => setEditing(false)}>退出编辑</button></header><form className="work-creator work-detail-editor" onSubmit={save}>
    <div className="work-creator-heading"><b>EDIT CASE / 编辑案例</b><span>图文内容实时编辑</span></div>
    <label>管理员密钥<input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} required /></label>
    <label>案例标题<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required /></label>
    <label>简短介绍<input value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={180} required /></label>
    <div className="work-media-editor"><div className="work-media-toolbar"><span>{blocks.length} 张图片</span><button type="button" disabled={!blocks.some((block) => block.selected)} onClick={deleteSelected}>删除所选</button></div>
      {blocks.map((block,index) => <article className={`work-editor-block ${block.selected ? "selected" : ""} ${block.preview ? "" : "text-only"}`} key={block.id}><button className="media-select" type="button" onClick={() => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item,selected:!item.selected } : item))}>{block.selected ? "✓" : ""}</button>{block.preview ? <img className="work-live-preview" src={block.preview} alt={`案例图片 ${index+1}`} onClick={() => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item,selected:!item.selected } : item))} /> : <div className="work-text-canvas"><span>TEXT / 文字内容</span></div>}<textarea className="work-inline-copy" value={block.text} placeholder="点击这里，直接输入文字……" onChange={(event) => { const text=event.target.value; setBlocks((current) => current.map((item) => item.id === block.id ? { ...item,text } : item)); }} onInput={(event) => { event.currentTarget.style.height="auto"; event.currentTarget.style.height=`${event.currentTarget.scrollHeight}px`; }} /></article>)}
      <label className="work-free-copy"><span>文字内容</span><textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} maxLength={20000} placeholder="即使不添加图片，也可以直接在这里输入文字……" /></label>
      <div className="work-add-controls single"><label className="work-image-upload"><span>＋ 添加图片</span><small>可连续添加，不限制张数 · 单张 8MB MAX</small><input type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); event.currentTarget.value=""; }} /></label></div>
    </div><button disabled={saving}>{saving ? "保存中…" : "保存案例"}</button>{notice && <p>{notice}</p>}
  </form></main>;

  return <main className="work-page"><header><a href="/#selected">← SELECTED WORKS</a><button onClick={beginEdit}>编辑案例</button></header><article><div className="work-article-meta"><span>CASE / {String(work.id).padStart(3,"0")}</span><time>{new Date(work.createdAt).toLocaleDateString("zh-CN")}</time></div><h1>{work.title}</h1><p className="work-article-summary">{work.summary}</p>{work.blocks?.length ? <div className="work-story-stream">{work.blocks.map((block,index) => <section className={block.imageKey ? "" : "text-only"} key={block.id}>{block.imageKey && <img src={mediaUrl(block.imageKey)} alt={`${work.title} ${index+1}`} />}{block.bodyText && <div className="work-story-copy">{block.bodyText.split(/\n+/).map((paragraph,paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>}</section>)}</div> : <>{media ? <img src={media} alt={work.title} /> : <div className={`work-article-generated work-generated-${work.visualKey}`}><b>{work.title}</b></div>}<div className="work-article-copy">{work.content.split(/\n+/).map((paragraph,index) => <p key={index}>{paragraph}</p>)}</div></>}</article></main>;
}
