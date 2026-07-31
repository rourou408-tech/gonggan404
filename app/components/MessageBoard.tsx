"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Locale } from "./HomeExperience";

type Message = { id: number; content: string; avatar: string; likes: number; createdAt: string; isPinned?: boolean };
const samples: Message[] = [
  { id: 1, content: "很喜欢你的 AI 视觉实验，希望未来看到更多作品。", avatar: "SL", likes: 128, createdAt: "2026.07.31", isPinned: true },
  { id: 2, content: "The way you make technology feel human is quietly brilliant.", avatar: "AI", likes: 82, createdAt: "2026.07.30" },
  { id: 3, content: "期待下一次跨越品牌与 AI 的视觉碰撞。", avatar: "∞", likes: 34, createdAt: "2026.07.29" },
];

const text = {
  zh: { label: "访客留言", title: "留下一句话", english: "LEAVE A MESSAGE", body: "你的想法，可能成为下一次创造的起点。", placeholder: "输入留言，最多 50 字……", submit: "提交", chars: "字", empty: "请先写下一句话。", blocked: "内容未通过自动审核，请换一种表达。", pending: "已收到，审核通过后公开显示。", pin: "官方精选留言", like: "点赞", sort: "默认按点赞排序", loading: "正在读取留言" },
  en: { label: "Visitor Message", title: "Leave a message", english: "留下你的想法", body: "Your thought might become the starting point for the next creation.", placeholder: "Write a message, maximum 50 characters...", submit: "Submit", chars: "characters", empty: "Please write something first.", blocked: "This message did not pass automatic review.", pending: "Received. It will appear after review.", pin: "Official selection", like: "Like", sort: "Sorted by likes", loading: "Loading messages" },
};

export function MessageBoard({ locale }: { locale: Locale }) {
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState(samples);
  const [liked, setLiked] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = text[locale];
  const sorted = useMemo(() => [...messages].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)) || b.likes - a.likes || b.createdAt.localeCompare(a.createdAt)), [messages]);

  useEffect(() => {
    const visitor = localStorage.getItem("sankou-visitor-id") || crypto.randomUUID();
    localStorage.setItem("sankou-visitor-id", visitor);
    try { setLiked(JSON.parse(localStorage.getItem("sankou-liked") || "[]")); } catch { setLiked([]); }
    fetch("/api/messages").then((response) => response.ok ? response.json() : null).then((data) => { if (data?.messages?.length) setMessages(data.messages); }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); const value = content.trim(); setNotice("");
    if (!value) return setNotice(t.empty);
    if (/https?:\/\/|博彩|赌博|色情|诈骗|spam/i.test(value)) return setNotice(t.blocked);
    setSubmitting(true);
    try {
      const visitorId = localStorage.getItem("sankou-visitor-id") || crypto.randomUUID();
      const response = await fetch("/api/messages", { method: "POST", headers: { "content-type": "application/json", "x-visitor-id": visitorId }, body: JSON.stringify({ content: value }) });
      if (!response.ok) throw new Error();
      setContent(""); setNotice(t.pending);
    } catch { setNotice(t.blocked); } finally { setSubmitting(false); }
  }

  async function like(id: number) {
    if (liked.includes(id)) return;
    const nextLiked = [...liked, id]; setLiked(nextLiked); localStorage.setItem("sankou-liked", JSON.stringify(nextLiked));
    setMessages((current) => current.map((message) => message.id === id ? { ...message, likes: message.likes + 1 } : message));
    try { await fetch(`/api/messages/${id}/like`, { method: "POST", headers: { "x-visitor-id": localStorage.getItem("sankou-visitor-id") || "" } }); } catch { /* optimistic state remains device-local */ }
  }

  return <section className="message-section section-pad" id="message">
    <div className="message-intro"><div><div className="section-index">00 / {t.label.toUpperCase()}</div><h2>{t.title}<small> / {t.english}</small></h2></div><p>{t.body}</p></div>
    <form className="message-form" onSubmit={submit}><textarea aria-label={t.title} maxLength={50} value={content} onChange={(event) => setContent(event.target.value)} placeholder={t.placeholder} /><div className="message-form-bottom"><span>{content.length} / 50 {t.chars}</span><strong role="status">{notice}</strong><button type="submit" disabled={submitting}>{submitting ? "…" : t.submit}<b>→</b></button></div></form>
    <div className="message-toolbar"><div className="message-toolbar-left"><span>{String(sorted.length).padStart(2, "0")} MESSAGES</span>{sorted.some((message) => message.isPinned) && <b>● {t.pin}</b>}</div><span>{t.sort} ↓</span></div>
    <div className="message-grid">{sorted.map((message, index) => <article className={message.isPinned ? "message-card pinned" : "message-card"} key={message.id}><div className="message-number">{String(index + 1).padStart(2, "0")}</div><div className="anon-avatar">{message.avatar}</div><p>{message.content}</p><div className="message-card-foot"><time>{message.createdAt}</time><button className={liked.includes(message.id) ? "liked" : ""} onClick={() => like(message.id)} aria-label={`${t.like} ${message.likes}`}><span aria-hidden="true">♥</span>{message.likes}</button></div></article>)}</div>
  </section>;
}
