"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY="sankou-surface-opacity-v2";
const DEFAULT_OPACITY=58;

export function SurfaceOpacityControl({ locale }:{ locale:"zh"|"en" }) {
  const [opacity,setOpacity]=useState(DEFAULT_OPACITY);

  useEffect(() => {
    const stored=localStorage.getItem(STORAGE_KEY);
    const saved=stored===null ? Number.NaN : Number(stored);
    const initial=Number.isFinite(saved) && saved>=0 && saved<=100 ? saved : DEFAULT_OPACITY;
    setOpacity(initial);
    document.documentElement.style.setProperty("--surface-opacity",String(initial/100));
  },[]);

  function update(value:number) {
    setOpacity(value);
    document.documentElement.style.setProperty("--surface-opacity",String(value/100));
    localStorage.setItem(STORAGE_KEY,String(value));
  }

  const label=locale==="zh" ? "背景透明度" : "BACKGROUND OPACITY";
  return <label className="surface-opacity-control" title={`${label}: ${opacity}%`}>
    <span>{locale==="zh" ? "背景" : "BG"}</span>
    <input type="range" min="0" max="100" step="1" value={opacity} onChange={(event) => update(Number(event.target.value))} aria-label={label} />
    <output>{opacity}</output>
  </label>;
}
