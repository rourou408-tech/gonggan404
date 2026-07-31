"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Locale } from "./HomeExperience";

export type WorkBlock = { id:number; imageKey:string; imageType:string; bodyText:string; sortOrder:number };
export type Work = { id:number; title:string; summary:string; content:string; imageKey:string; imageType?:string; visualKey:string; sortOrder:number; createdAt:string; blocks?:WorkBlock[] };
type MediaBlock = { id:string; file?:File; preview:string; text:string; selected:boolean };
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

function WorkVisual({ work,index }:{ work:Work; index:number }) {
  if (work.imageKey) return <img src={mediaUrl(work.imageKey)} alt={work.title} />;
  return <div className={`work-generated work-generated-${work.visualKey}`}><span>{String(index+1).padStart(2,"0")} / CASE</span><b>{work.title}</b><small>{work.summary}</small></div>;
}

export function SelectedWorks({ locale }:{ locale:Locale }) {
  const [works,setWorks] = useState<Work[]>([]);
  const [creating,setCreating] = useState(false);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState("");
  const [adminKey,setAdminKey] = useState("");
  const [dragged,setDragged] = useState<number | null>(null);
  const [mediaBlocks,setMediaBlocks] = useState<MediaBlock[]>([]);
  const [freeText,setFreeText] = useState("");
  const worksRef = useRef<Work[]>([]);

  const load = () => fetch("/api/works").then((response) => response.json()).then((data) => setWorks(data.works || []));
  useEffect(() => {
    const syncOwner = () => setAdminKey(localStorage.getItem("sankou-owner-key") || "");
    syncOwner();
    window.addEventListener("sankou-owner-change",syncOwner);
    load().catch(() => undefined);
    return () => window.removeEventListener("sankou-owner-change",syncOwner);
  },[]);
  useEffect(() => { worksRef.current=works; },[works]);

  function exchange(targetId:number) {
    if (dragged === null || dragged === targetId) return;
    setWorks((current) => {
      const from = current.findIndex((work) => work.id === dragged);
      const to = current.findIndex((work) => work.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moving] = next.splice(from,1);
      next.splice(to,0,moving);
      return next;
    });
  }

  async function persistOrder() {
    setDragged(null);
    if (!adminKey) return;
    await fetch("/api/works/order",{ method:"PATCH",headers:{ "content-type":"application/json","x-admin-key":adminKey },body:JSON.stringify({ ids:worksRef.current.map((work) => work.id) }) }).catch(() => undefined);
  }

  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (!mediaBlocks.length && !freeText.trim()) return setNotice("请输入文字或至少添加一张案例图片。");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const uploaded = [];
      for (const block of mediaBlocks) {
        if (block.file) {
          const imageForm = new FormData();
          const image = await optimizeImage(block.file);
          imageForm.append("image",image,image.name);
          const uploadResponse = await fetch("/api/works/uploads",{ method:"POST",headers:{ "x-admin-key":adminKey },body:imageForm });
          if (!uploadResponse.ok) throw new Error("图片上传失败");
          const upload = await uploadResponse.json();
          uploaded.push({ type:"image",imageKey:upload.imageKey,imageType:upload.imageType,text:block.text });
        } else uploaded.push({ type:"text",imageKey:"",imageType:"",text:block.text });
      }
      if (freeText.trim()) uploaded.push({ type:"text",imageKey:"",imageType:"",text:freeText.trim() });
      form.set("blocks",JSON.stringify(uploaded));
      const response = await fetch("/api/works",{ method:"POST",headers:{ "x-admin-key":adminKey },body:form });
      if (!response.ok) throw new Error();
      localStorage.setItem("sankou-owner-key",adminKey);
      event.currentTarget.reset(); mediaBlocks.forEach((block) => URL.revokeObjectURL(block.preview)); setMediaBlocks([]); setFreeText(""); setCreating(false); await load();
    } catch { setNotice("创建失败，请检查管理员密钥、文字和图片。图片最大 8MB。"); }
    finally { setSaving(false); }
  }

  function addImages(files:FileList | null) {
    if (!files?.length) return;
    const additions = Array.from(files).filter((file) => file.type.startsWith("image/")).map((file) => ({ id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),text:"",selected:false }));
    setMediaBlocks((current) => [...current,...additions]);
  }

  function toggleCreator() {
    setCreating((value) => !value);
  }

  function toggleImage(id:string) {
    setMediaBlocks((current) => current.map((block) => block.id === id ? { ...block,selected:!block.selected } : block));
  }

  function deleteSelectedImages() {
    setMediaBlocks((current) => { current.filter((block) => block.selected).forEach((block) => URL.revokeObjectURL(block.preview)); return current.filter((block) => !block.selected); });
  }

  return <section className="selected selected-works section-pad" id="selected">
    <div className="section-top"><div className="section-index">01 / {locale === "zh" ? "精选作品 / 品牌案例" : "SELECTED WORKS / BRAND CASES"}</div></div>
    <h2>{locale === "zh" ? <>从一个洞察，<br />生长出完整世界。</> : <>ONE INSIGHT GROWS<br />INTO A COMPLETE WORLD.</>}</h2>
    <div className="work-create-row"><button className="create-work-button" onClick={toggleCreator}>{creating ? (locale === "zh" ? "取消" : "CANCEL") : (locale === "zh" ? "创建新案例" : "NEW CASE")}</button></div>
    {creating && <form className="work-creator" onSubmit={create}>
      <div className="work-creator-heading"><b>NEW CASE / 创建新案例</b><span>封面图片建议 4:3 或 3:4</span></div>
      <label>管理员密钥<input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} required /></label>
      <label>案例标题<input name="title" maxLength={100} required /></label>
      <label>简短介绍<input name="summary" maxLength={180} required /></label>
      <div className="work-media-editor">
        <div className="work-media-toolbar"><span>{mediaBlocks.length} 张图片</span><button type="button" disabled={!mediaBlocks.some((block) => block.selected)} onClick={deleteSelectedImages}>删除所选</button></div>
        {mediaBlocks.map((block,index) => <article className={`work-editor-block ${block.selected ? "selected" : ""} ${block.preview ? "" : "text-only"}`} key={block.id}>
          <button className="media-select" type="button" onClick={() => toggleImage(block.id)} aria-label={`选择第 ${index+1} 张图片`}>{block.selected ? "✓" : ""}</button>
          {block.preview ? <img className="work-live-preview" src={block.preview} alt={`案例图片预览 ${index+1}`} onClick={() => toggleImage(block.id)} /> : <div className="work-text-canvas"><span>TEXT / 文字内容</span></div>}
          <textarea className="work-inline-copy" value={block.text} placeholder="点击这里，直接在图片下方输入文字……" onChange={(event) => { const text=event.target.value; setMediaBlocks((current) => current.map((item) => item.id === block.id ? { ...item,text } : item)); }} onInput={(event) => { event.currentTarget.style.height="auto"; event.currentTarget.style.height=`${event.currentTarget.scrollHeight}px`; }} />
        </article>)}
        <label className="work-free-copy"><span>文字内容</span><textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} maxLength={20000} placeholder="即使不添加图片，也可以直接在这里输入文字……" /></label>
        <div className="work-add-controls single"><label className="work-image-upload"><span>＋ 添加图片</span><small>可连续添加，不限制张数 · 单张 8MB MAX</small><input type="file" accept="image/*" multiple onChange={(event) => { addImages(event.target.files); event.currentTarget.value=""; }} /></label></div>
      </div>
      <button disabled={saving}>{saving ? "创建中…" : "创建案例"}</button>{notice && <p>{notice}</p>}
    </form>}
    <div className="works-drag-hint">{locale === "zh" ? "拖动案例可实时交换位置；管理员验证后自动保存排序。" : "Drag cases to exchange positions. Owner order is saved automatically."}</div>
    <div className="works-grid">{works.map((work,index) => <article key={work.id} className={`work-card work-slot-${index%6} ${dragged === work.id ? "dragging" : ""}`} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed="move"; setDragged(work.id); }} onDragEnter={(event) => { event.preventDefault(); exchange(work.id); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect="move"; }} onDragEnd={persistOrder} onDrop={(event) => { event.preventDefault(); persistOrder(); }}>
      <a href={`/works/${work.id}`} target="_blank" rel="noreferrer"><WorkVisual work={work} index={index} /><div className="work-card-caption"><span>{String(index+1).padStart(2,"0")}</span><div><b>{work.title}</b><small>{work.summary}</small></div><i>↗</i></div></a>
    </article>)}</div>
  </section>;
}
