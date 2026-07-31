"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sankou-owner-key";

export function AdminLogin({ locale }: { locale: "zh" | "en" }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || "";
    setKey(saved);
    if (saved) fetch("/api/admin/messages", { headers: { "x-admin-key": saved } }).then((response) => {
      setLoggedIn(response.ok);
      if (!response.ok) {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event("sankou-owner-change"));
      }
    }).catch(() => setLoggedIn(false));
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/admin/messages", { headers: { "x-admin-key": key } });
      if (!response.ok) throw new Error();
      localStorage.setItem(STORAGE_KEY, key);
      setLoggedIn(true);
      setOpen(false);
      window.dispatchEvent(new Event("sankou-owner-change"));
    } catch {
      setError(locale === "zh" ? "管理员密码不正确" : "Incorrect admin password");
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setKey("");
    setLoggedIn(false);
    setOpen(false);
    window.dispatchEvent(new Event("sankou-owner-change"));
  }

  return <div className="admin-login" ref={rootRef}>
    <button className={`admin-login-trigger ${loggedIn ? "active" : ""}`} type="button" onClick={() => { setOpen((value) => !value); setError(""); }} aria-expanded={open}>
      {loggedIn ? (locale === "zh" ? "管理中" : "ADMIN") : (locale === "zh" ? "管理员登录" : "ADMIN LOGIN")}
    </button>
    {open && <div className="admin-login-panel">
      <b>{locale === "zh" ? "管理员身份" : "ADMIN ACCESS"}</b>
      {loggedIn ? <><p>{locale === "zh" ? "已解锁网站编辑权限" : "Site editing is unlocked"}</p><button type="button" onClick={logout}>{locale === "zh" ? "退出登录" : "LOG OUT"}</button></> : <form onSubmit={login}>
        <input type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder={locale === "zh" ? "输入管理员密码" : "Admin password"} autoFocus required />
        <button disabled={checking}>{checking ? "..." : (locale === "zh" ? "登录" : "LOG IN")}</button>
        {error && <p>{error}</p>}
      </form>}
    </div>}
  </div>;
}
