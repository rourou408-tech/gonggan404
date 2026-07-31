"use client";

import { useState } from "react";
import { MessageBoard } from "./MessageBoard";
import { BlogPreview } from "./BlogPreview";
import { SelectedWorks } from "./SelectedWorks";
import { AdminLogin } from "./AdminLogin";
import { SurfaceOpacityControl } from "./SurfaceOpacityControl";

export type Locale = "zh" | "en";

const copy = {
  zh: {
    role: "AI 创意导演 / 视觉设计师",
    nav: ["留言", "作品", "实验室", "日志", "关于"],
    heroKicker: "人类直觉 × AI 协作系统",
    heroTitle: "创造尚未\n存在的视觉。",
    heroBody: "我是 Sankou Lee，探索人类创意、品牌叙事与智能系统之间的新视觉语言。",
    explore: "探索作品",
    selected: "精选作品 / 品牌案例",
    selectedTitle: "从一个洞察，\n生长出完整世界。",
    statement: "AI 创意宣言",
    quote: "AI 不是审美的捷径。它是一种新材料，用来形成更鲜明的观点。",
    about: "关于我",
    aboutTitle: "让好奇心\n拥有方向。",
    aboutBody: "我关注策略与图像相遇的瞬间。把品牌命题转化为可感知、可传播、可持续演化的视觉系统。",
    lab: "AI 视觉实验室",
    labTitle: "持续发生的\n视觉试验。",
    labBody: "合成摄影、动态视觉、未来字体与生成式身份的开放实验场。",
    journal: "AI 设计思考",
    journalTitle: "记录工具之外的判断。",
    prompts: "AI 提示词档案",
    promptsTitle: "把灵感变成\n可复用的方法。",
    assistant: "数字设计顾问",
    assistantTitle: "带着你的问题，\n开始一次创意对话。",
    assistantHint: "描述你的品牌、产品或当下卡住的问题",
    assistantButton: "开始咨询",
    contact: "合作入口",
    contactTitle: "一起做点\n尚未发生的事。",
    available: "目前开放 2026 Q4 合作",
  },
  en: {
    role: "AI Creative Director / Visual Designer",
    nav: ["Messages", "Works", "Lab", "Journal", "About"],
    heroKicker: "Human intuition × AI collaboration",
    heroTitle: "Creating visuals\nthat do not exist yet.",
    heroBody: "I am Sankou Lee, exploring a new visual language between human creativity, brand narratives, and intelligent systems.",
    explore: "Explore works",
    selected: "Selected Works / Brand Cases",
    selectedTitle: "One insight grows\ninto a complete world.",
    statement: "AI Statement",
    quote: "AI is not a shortcut to taste. It is a new material for forming a stronger point of view.",
    about: "About",
    aboutTitle: "Curiosity,\nwith direction.",
    aboutBody: "I focus on the moment when strategy meets image, turning brand questions into visual systems that can be felt, shared, and continuously evolved.",
    lab: "AI Creative Lab",
    labTitle: "Visual experiments\nin progress.",
    labBody: "An open field for synthetic photography, motion, future typography, and generative identities.",
    journal: "AI Journal",
    journalTitle: "Judgment beyond the tools.",
    prompts: "Prompt Archive",
    promptsTitle: "Turn inspiration into\na repeatable method.",
    assistant: "AI Assistant",
    assistantTitle: "Bring a question.\nStart a creative dialogue.",
    assistantHint: "Describe your brand, product, or current creative block",
    assistantButton: "Start consulting",
    contact: "Contact",
    contactTitle: "Let us make what\nhas not happened yet.",
    available: "Available for selected Q4 2026 projects",
  },
};

const navItems = [
  { id: "home", zh: "首页", en: "HOME" },
  { id: "blog", zh: "创作博客", en: "BLOG" },
  { id: "selected", zh: "精选作品", en: "WORKS" },
  { id: "about", zh: "关于我", en: "ABOUT" },
  { id: "lab", zh: "AI视觉实验室", en: "AI CREATIVE LAB" },
  { id: "contact", zh: "合作入口", en: "CONTACT" },
];

export function HomeExperience() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [assistantText, setAssistantText] = useState("");
  const t = copy[locale];
  const lines = (value: string) => value.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>);

  return <main className="site-shell">
    <header className="topbar">
      <div className="topbar-main"><a className="wordmark" href="#home" aria-label="Sankou Lee 首页"><b>SANKOU</b><span>LEE</span></a><span className="nav-role">{t.role}</span><SurfaceOpacityControl locale={locale} /><div className="language-switch" aria-label="语言切换"><button className={locale === "zh" ? "active" : ""} onClick={() => setLocale("zh")} aria-pressed={locale === "zh"}><span>中</span></button><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}><span>EN</span></button></div><AdminLogin locale={locale} /></div>
      <nav className="section-nav" aria-label="首页模块导航">{navItems.map((item) => <a key={item.id} href={`#${item.id}`}><span className="nav-desktop-label">{locale === "zh" ? item.zh : item.en}<small>{locale === "zh" ? item.en : item.zh}</small></span><span className="nav-mobile-label">{item.zh}</span></a>)}</nav>
    </header>

    <div id="home" className="home-anchor" />
    <SelectedWorks locale={locale} />
    <MessageBoard locale={locale} />

    <section className="hero" id="hero">
      <div className="hero-editorial">
        <div className="section-index">01 / SANKOU LEE / CREATIVE PRACTICE</div>
        <p className="hello-line">HELLO! EVERYONE!</p>
        <p className="hello-note">WE ARE A DESIGN PRACTICE FULL OF CURIOSITY<br />我们用设计把未知变成可以感知的世界</p>
        <div className="hero-left"><strong>WE CREATE</strong><small>{t.heroKicker}<br />{t.heroBody}</small><b>SANKOU<br />LEE LAB</b></div>
        <div className="orbit-mark" aria-hidden="true"><i /><i /><span>∞</span></div>
        <div className="hero-arrow" aria-hidden="true">→</div>
        <div className="hero-right"><strong>DESIGN<br />FOR<br />DREAMS<br /><u>2026</u></strong><small>AI CREATIVE DIRECTION<br />BRAND / VISUAL / SYSTEM</small></div>
        <a className="editorial-link" href="#selected">{t.explore}<span>↓</span></a>
      </div>
    </section>

    <BlogPreview locale={locale} />

    <section className="selected legacy-selected section-pad" id="legacy-selected">
      <div className="section-top"><div className="section-index">02 / {t.selected.toUpperCase()}</div><p>2025—2026</p></div>
      <h2>{lines(t.selectedTitle)}</h2>
      <div className="portfolio-mosaic">
        <article className="mosaic-tile tile-a tile-magenta"><span>01 / IDENTITY</span><strong>VOID</strong><p>{locale === "zh" ? "数字时装身份" : "DIGITAL FASHION IDENTITY"}</p></article>
        <article className="mosaic-tile tile-b visual-crop graphic-orbit"><div className="tile-art"><i /><i /><strong>∞</strong></div><div className="tile-caption"><span>02 / AI SYSTEM</span><b>NOVA<br />TWIN</b></div></article>
        <article className="mosaic-tile tile-c tile-slogan"><span>03 / CAMPAIGN</span><strong>{locale === "zh" ? <>让科技<br />更像人。</> : <>TECH WITH<br />A HUMAN PULSE.</>}</strong><i>ANU / 2026</i></article>
        <article className="mosaic-tile tile-d visual-crop graphic-type"><div className="tile-art"><strong>A<br />I</strong><i>↗</i></div><div className="tile-caption"><span>04 / GENERATIVE TYPE</span><b>DUAL<br />SIGNAL</b></div></article>
        <article className="mosaic-tile tile-e visual-crop graphic-memory"><div className="tile-art"><span>●</span><span>●</span><span>●</span><strong>MEM<br />ORY</strong></div><div className="tile-caption"><span>05 / AI FILM</span><b>{locale === "zh" ? "合成记忆" : "SYNTHETIC MEMORY"}</b></div></article>
        <article className="mosaic-tile tile-f tile-wordmark"><span className="signal-mark">S</span><strong>SANKOU <i>×</i> INTELLIGENCE</strong><small>BRAND SYSTEM / 2026</small></article>
        <article className="mosaic-tile tile-g tile-coral"><span>06 / MOTION</span><strong>MAKE<br />IDEAS<br />MOVE.</strong></article>
        <article className="mosaic-tile tile-h tile-lime"><span>07 / RETAIL</span><strong>{locale === "zh" ? <>未来不是风格，<br />是一种体验。</> : <>THE FUTURE IS<br />AN EXPERIENCE.</>}</strong><small>ANU NEW RETAIL</small></article>
        <article className="mosaic-tile tile-i tile-symbol"><span>08 / SYSTEM</span><strong>◎</strong><p>HUMAN<br />MACHINE<br />CULTURE</p></article>
        <article className="mosaic-tile tile-j visual-crop graphic-world"><div className="tile-art"><strong>◎</strong><span>NEW WORLD</span></div><div className="tile-caption"><span>09 / WORLD</span><b>NEW<br />SPECIES</b></div></article>
        <article className="mosaic-tile tile-k tile-arrow"><span>10 / EXPERIENCE</span><strong>↗</strong><p>{locale === "zh" ? "进入未来现场" : "ENTER THE NEXT"}</p></article>
      </div>
    </section>

    <section className="manifesto section-pad" id="statement"><div className="section-index">03 / {t.statement.toUpperCase()}</div><p className="manifesto-mark">“</p><blockquote>{t.quote}</blockquote><div className="manifesto-sign">SANKOU LEE <span>2026</span></div></section>

    <section className="about section-pad" id="about"><div className="section-index">04 / {t.about.toUpperCase()}</div><div className="two-col"><h2>{lines(t.aboutTitle)}</h2><div><p>{t.aboutBody}</p><dl><div><dt>12+</dt><dd>{locale === "zh" ? "品牌合作" : "Brand projects"}</dd></div><div><dt>06</dt><dd>{locale === "zh" ? "创意领域" : "Creative fields"}</dd></div><div><dt>∞</dt><dd>{locale === "zh" ? "持续实验" : "Experiments"}</dd></div></dl></div></div></section>

    <section className="lab section-pad" id="lab"><div className="section-index">05 / {t.lab.toUpperCase()}</div><div className="two-col"><h2>{lines(t.labTitle)}</h2><p>{t.labBody}</p></div><div className="lab-tape"><span>IMAGE / 024</span><b>生成肖像</b><span>MOTION / 011</span><b>动态形态</b><span>TYPE / 038</span><b>未来字体</b></div><div className="experiment-grid"><article><span>01</span><div className="scan-face">HUMAN<br />SIGNAL</div></article><article><span>02</span><div className="type-field">形<br />态</div></article><article><span>03</span><div className="data-field">0101<br />1100<br />1010</div></article></div></section>

    <section className="journal section-pad" id="journal"><div className="section-index">07 / {t.journal.toUpperCase()}</div><h2>{t.journalTitle}</h2><div className="journal-grid"><article><time>2026.07.28</time><h3>{locale === "zh" ? "当所有人都有 AI，真正稀缺的是什么？" : "When everyone has AI, what remains scarce?"}</h3><p>ESSAY 008 / 6 MIN</p></article><article><time>2026.06.16</time><h3>{locale === "zh" ? "提示词不是答案，判断才是。" : "Prompts are not answers. Judgment is."}</h3><p>NOTE 021 / 3 MIN</p></article></div></section>

    <section className="prompts section-pad" id="prompts"><div className="section-index">08 / {t.prompts.toUpperCase()}</div><div className="two-col"><h2>{lines(t.promptsTitle)}</h2><p>{locale === "zh" ? "经过真实项目验证的图像方法、结构模板与迭代记录。" : "Image methods, structures, and iteration logs tested through real projects."}</p></div><div className="prompt-stack"><article><span>PORTRAIT / 001</span><p>Editorial dual-identity portrait, hard studio light, tactile skin...</p><button>＋</button></article><article><span>BRAND WORLD / 014</span><p>Future retail environment, modular visual language, human scale...</p><button>＋</button></article><article><span>MOTION / 009</span><p>Kinetic typography, controlled rhythm, signal interference...</p><button>＋</button></article></div></section>

    <section className="assistant section-pad" id="assistant"><div className="section-index">09 / {t.assistant.toUpperCase()}</div><h2>{lines(t.assistantTitle)}</h2><div className="assistant-console"><div className="assistant-head"><span>SL / AI CONSULTANT</span><i>ONLINE</i></div><textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} placeholder={t.assistantHint} maxLength={300} /><div><span>{assistantText.length} / 300</span><a href={`mailto:hello@sankoulee.com?subject=AI Creative Consultation&body=${encodeURIComponent(assistantText)}`}>{t.assistantButton} <b>→</b></a></div></div></section>

    <section className="contact section-pad" id="contact"><div className="section-index">10 / {t.contact.toUpperCase()}</div><h2>{lines(t.contactTitle)}</h2><a className="contact-mail" href="mailto:hello@sankoulee.com">HELLO@SANKOULEE.COM <span>↗</span></a><div className="availability"><i /> {t.available}</div><footer><span>© 2026 SANKOU LEE</span><span>SHANGHAI / GLOBAL</span><a href="/admin">MESSAGE ADMIN</a></footer></section>
  </main>;
}
