import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   Inject global styles (keyframes, scrollbar,
   noise overlay, reveal classes) once
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --obsidian: #080809;
    --charcoal: #0f0f11;
    --surface: #161619;
    --elevated: #1d1d21;
    --border: #2a2a2f;
    --border-bright: #3d3d46;
    --violet: #7c6ef7;
    --violet-glow: rgba(124,110,247,0.18);
    --violet-dim: rgba(124,110,247,0.06);
    --violet-bright: #a598ff;
    --text-primary: #f0f0f4;
    --text-secondary: #8a8a96;
    --text-muted: #4a4a56;
    --success: #4caf82;
    --danger: #e05252;
    --warning: #e8a320;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: var(--obsidian);
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* noise overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    z-index: 1000;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--obsidian); }
  ::-webkit-scrollbar-thumb { background: var(--violet); border-radius: 2px; }

  /* keyframes */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.8); }
  }
  @keyframes floatCard {
    0%, 100% { transform: translateY(0) rotateX(4deg) rotateY(-4deg); }
    50%       { transform: translateY(-18px) rotateX(4deg) rotateY(-4deg); }
  }
  @keyframes ambientPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.1); opacity: 0.7; }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes shimmer-line {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.9; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(4px); }
  }
  @keyframes growBar {
    from { width: 0; }
    to   { width: 76%; }
  }

  /* hero animations */
  .hero-eyebrow { opacity: 0; animation: fadeUp 0.8s 0.2s forwards; }
  .hero-title   { opacity: 0; animation: fadeUp 0.8s 0.4s forwards; }
  .hero-sub     { opacity: 0; animation: fadeUp 0.8s 0.6s forwards; }
  .hero-actions { opacity: 0; animation: fadeUp 0.8s 0.8s forwards; }
  .hero-stats   { opacity: 0; animation: fadeUp 0.8s 1.0s forwards; }

  .eyebrow-dot { animation: pulse 2s infinite; }

  .card-inner { 
    transform-style: preserve-3d;
    transition: transform 0.9s cubic-bezier(0.4,0,0.2,1);
    animation: floatCard 6s ease-in-out infinite;
  }
  .card-scene:hover .card-inner { animation: none; transform: rotateY(180deg); }

  .card-face { backface-visibility: hidden; }
  .card-back { transform: rotateY(180deg); }

  .ambient-glow { animation: ambientPulse 4s ease-in-out infinite; }

  .marquee-track { animation: marquee 30s linear infinite; }

  .text-line { animation: shimmer-line 2s ease-in-out infinite; }
  .text-line:nth-child(1) { width: 85%; animation-delay: 0s; }
  .text-line:nth-child(2) { width: 70%; animation-delay: 0.1s; }
  .text-line:nth-child(3) { width: 90%; animation-delay: 0.2s; }
  .text-line:nth-child(4) { width: 60%; animation-delay: 0.3s; }
  .text-line:nth-child(5) { width: 78%; animation-delay: 0.4s; }

  .gen-arrow { animation: bounce 1.5s ease-in-out infinite; }

  .score-progress-fill {
    height: 100%;
    width: 76%;
    background: linear-gradient(90deg, var(--violet), var(--violet-bright));
    border-radius: 3px;
    animation: growBar 1.5s 0.3s both;
  }

  /* scroll reveal */
  .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }

  /* f-card top line */
  .f-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--violet), transparent);
  }

  /* col-row accent bar */
  .col-row::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .col-row.c1::before { background: var(--violet); }
  .col-row.c2::before { background: var(--success); }
  .col-row.c3::before { background: var(--warning); }
  .col-row.c4::before { background: var(--danger); }

  /* featured testimonial top bar */
  .testimonial-featured::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--violet), transparent);
  }

  /* hero grid bg */
  .hero-grid::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(42,42,47,0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(42,42,47,0.15) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }

  /* masonry */
  .masonry { columns: 3; column-gap: 20px; }
  @media (max-width: 1024px) { .masonry { columns: 2; } }
  @media (max-width: 640px)  { .masonry { columns: 1; } }

  /* feature reverse */
  .feature-reverse { direction: rtl; }
  .feature-reverse > * { direction: ltr; }

  @media (max-width: 768px) {
    .hero-grid { grid-template-columns: 1fr !important; }
    .hero-right { padding: 40px 16px 80px 16px !important; }
    .feature-grid { grid-template-columns: 1fr !important; }
    .feature-reverse { direction: ltr; }
  }
`;

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Reusable tiny components ── */

function Tag({ icon, children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--violet-dim)", border: "1px solid rgba(124,110,247,0.2)", borderRadius: 4, padding: "4px 10px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--violet-bright)", textTransform: "uppercase", marginBottom: 16 }}>
      {icon}
      {children}
    </div>
  );
}

/* ── Visual Panels ── */

function TextPasteVisual() {
  return (
    <div className="f-card" style={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Input — Study Material</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-line" style={{ height: 8, borderRadius: 4, background: "var(--border)" }} />
        ))}
      </div>
      <div className="gen-arrow" style={{ textAlign: "center", color: "var(--violet)", fontSize: 24, margin: "12px 0" }}>↓</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--violet-bright)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Generated Cards</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {["What is photosynthesis?", "Define chlorophyll.", "ATP production stages?"].map((q) => (
          <div key={q} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>{q}</span>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(76,175,130,0.15)", border: "1px solid var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--success)" }}>✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizVisual() {
  return (
    <div className="f-card" style={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500, marginBottom: 16 }}>Which layer of the OSI model handles routing?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Data Link", cls: "" },
            { label: "Network ✓", cls: "correct" },
            { label: "Transport ✗", cls: "wrong" },
            { label: "Session", cls: "" },
          ].map(({ label, cls }) => (
            <div key={label} style={{
              padding: "10px 8px", borderRadius: 6, fontSize: 11, fontFamily: "'DM Mono', monospace",
              border: cls === "correct" ? "1px solid var(--success)" : cls === "wrong" ? "1px solid var(--danger)" : "1px solid var(--border)",
              background: cls === "correct" ? "rgba(76,175,130,0.1)" : cls === "wrong" ? "rgba(224,82,82,0.1)" : "var(--elevated)",
              color: cls === "correct" ? "var(--success)" : cls === "wrong" ? "var(--danger)" : "var(--text-secondary)",
              textAlign: "center",
            }}>{label}</div>
          ))}
        </div>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: "var(--violet-bright)", lineHeight: 1 }}>76%</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>Score</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>19 / 25 correct</div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <div className="score-progress-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectionsVisual() {
  const cols = [
    { cls: "c1", icon: "📘", name: "Computer Science", count: "6 decks · 142 cards", badge: "Active" },
    { cls: "c2", icon: "🧬", name: "Molecular Biology", count: "4 decks · 89 cards", badge: "Study" },
    { cls: "c3", icon: "📐", name: "Linear Algebra", count: "3 decks · 64 cards", badge: "Review" },
    { cls: "c4", icon: "🌍", name: "World History", count: "7 decks · 201 cards", badge: "Archive" },
  ];
  return (
    <div className="f-card" style={{ background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Your Collections</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cols.map(({ cls, icon, name, count, badge }) => (
          <div key={name} className={`col-row ${cls}`} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{count}</div>
            </div>
            <div style={{ background: "var(--border)", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{badge}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEMO_CARDS = [
  { question: 'What is photosynthesis?', answer: 'The process by which green plants convert sunlight into food using CO₂ and water.' },
  { question: "What is Newton's 1st Law?", answer: 'An object at rest stays at rest unless acted upon by an external force.' },
  { question: 'What is mitosis?', answer: 'Cell division producing two genetically identical daughter cells.' },
];

function DemoFlashCard() {
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 600);
    const handle = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Auto-flip on mobile so the user sees both sides
  useEffect(() => {
    if (!isMobile) return;
    const t = setTimeout(() => setFlipped(f => !f), 2200);
    return () => clearTimeout(t);
  }, [flipped, isMobile, index]);

  // Cycle to next card after showing answer
  useEffect(() => {
    if (!flipped) return;
    const t = setTimeout(() => {
      setFlipped(false);
      setIndex(i => (i + 1) % DEMO_CARDS.length);
    }, 2800);
    return () => clearTimeout(t);
  }, [flipped]);

  const card = DEMO_CARDS[index];
  const w = isMobile ? '100%' : 420;
  const h = isMobile ? 160 : 250;

  const frontStyle = { 
    background: 'linear-gradient(135deg,#1a1a20 0%,#12121a 100%)', 
    boxShadow: '0 0 0 1px rgba(124,110,247,0.06),0 40px 80px rgba(0,0,0,0.6),0 0 80px rgba(124,110,247,0.08),inset 0 1px 0 rgba(255,255,255,0.04)',
    flexDirection: 'column', gap: 8 
  };
  const backStyle = { 
    background: 'linear-gradient(135deg,#18161f 0%,#0f0e16 100%)', 
    border: '1px solid rgba(124,110,247,0.3)', 
    boxShadow: '0 40px 80px rgba(0,0,0,0.6),0 0 80px rgba(124,110,247,0.15),inset 0 1px 0 rgba(124,110,247,0.1)',
    flexDirection: 'column', gap: 8 
  };

  return (
    <div style={{ width: '100%', maxWidth: w, margin: '0 auto' }}>
      <div className="card-scene" style={{ width: '100%', height: h }}>
        <div
          className={`card-inner ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Show question' : 'Tap to reveal answer'}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setFlipped(f => !f); }}
          style={{ animation: flipped ? 'none' : undefined }}
        >
          <div className="card-face card-front" style={frontStyle}>
            <span className="card-label" style={{ position: 'absolute', top: 16, left: 16, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', background: "var(--violet-dim)", border: "1px solid rgba(124,110,247,0.2)", borderRadius: 6, padding: "4px 10px", color: "var(--violet-bright)", textTransform: "uppercase" }}>Q</span>
            <p style={{ fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-md)', fontWeight: 500, color: 'var(--text-primary)' }}>
              {card.question}
            </p>
            {!flipped && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-3.21" /></svg>
                {isMobile ? 'Tap to flip' : 'Click to flip'}
              </span>
            )}
          </div>
          <div className="card-face card-back" style={backStyle}>
            <span className="card-label" style={{ position: 'absolute', top: 16, left: 16, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', background: "rgba(124,110,247,0.12)", border: "1px solid rgba(124,110,247,0.3)", borderRadius: 6, padding: "4px 10px", color: "var(--violet-bright)", textTransform: "uppercase" }}>A</span>
            <p style={{ fontSize: isMobile ? 'var(--text-xs)' : 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {card.answer}
            </p>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {DEMO_CARDS.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i === index ? 'var(--accent)' : 'var(--border-subtle)',
            transition: 'background 300ms ease',
            cursor: 'pointer',
          }} onClick={() => { setIndex(i); setFlipped(false); }} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById("fl-global-css")) {
      const style = document.createElement("style");
      style.id = "fl-global-css";
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useScrollReveal();

  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const marqueeItems = ["Text Paste", "PDF Upload", "Word Documents", "Topic Search", "Quiz Mode", "Collections", "Gemini AI", "Spaced Repetition", "Export Decks", "Auto-Save"];

  const testimonials = [
    { featured: true, stars: 5, quote: <>I uploaded my entire operating systems textbook as a PDF and had <strong>180 flashcards in under 60 seconds.</strong> Passed my exam with the highest score in the class.</>, name: "Arjun Mehta", role: "CS · IIT Delhi", initials: "A", gradient: "linear-gradient(135deg,#7c6ef7,#a598ff)", topReview: true },
    { featured: false, stars: 5, quote: <>The quiz mode is <strong>addictive.</strong> I set a 15-second timer per card and suddenly retention went through the roof. This actually works.</>, name: "Sofia Reyes", role: "Med Student · Madrid", initials: "S", gradient: "linear-gradient(135deg,#4caf82,#6dcfa2)" },
    { featured: false, stars: 5, quote: <>Switched from Anki. The UI alone was enough — but the <strong>AI-generated cards are genuinely better</strong> than the ones I spent hours writing myself.</>, name: "Kai Lindberg", role: "Law Student · Stockholm", initials: "K", gradient: "linear-gradient(135deg,#e8a320,#f0c060)" },
    { featured: false, stars: 5, quote: <>Pasted my biochem lecture notes at 11pm before a 9am exam. <strong>Generated 40 cards, studied for 2 hours, got an A.</strong> This is insane.</>, name: "Priya Nair", role: "Biochemistry · UCL", initials: "P", gradient: "linear-gradient(135deg,#e05252,#f07070)" },
    { featured: false, stars: 5, quote: <>The Collections feature changed how I study. I have every subject organized, can quiz across multiple decks simultaneously, and <strong>actually track my progress.</strong></>, name: "Marcus Chen", role: "MBA · INSEAD", initials: "M", gradient: "linear-gradient(135deg,#7c6ef7,#5e52c0)" },
    { featured: true, stars: 5, quote: <>I teach a university course. I started using FlashLearn to build study materials for my students. The <strong>topic search is scary good</strong> — it knows exactly what matters.</>, name: "Dr. Elena Rossi", role: "Professor · Bocconi", initials: "D", gradient: "linear-gradient(135deg,#4caf82,#2d8f65)", featuredLabel: "Featured" },
    { featured: false, stars: 4, quote: <>Finally a flashcard tool that <strong>doesn't look like it was designed in 2009.</strong> The dark mode is beautiful, the cards are clean, and the whole flow just works.</>, name: "Jordan Wells", role: "UX Designer · Berlin", initials: "J", gradient: "linear-gradient(135deg,#e8a320,#c07010)" },
    { featured: false, stars: 5, quote: <>Uploaded a 48-page DOCX thesis. Got <strong>50 high-quality cards</strong> that perfectly captured the key arguments. Used them for my viva prep. First class result.</>, name: "Olivia Thompson", role: "PhD Candidate · Oxford", initials: "O", gradient: "linear-gradient(135deg,#a598ff,#7c6ef7)" },
  ];

  return (
    <div style={{ background: "var(--obsidian)", color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ── */}
      <header className="home-header" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        background: scrolled ? "rgba(8,8,9,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        transition: "all 0.4s ease",
      }}>
        <div className="home-nav-container" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 48px',
        }}>
            {/* Logo */}
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.05em", flexShrink: 0 }}>
              <span style={{ color: "var(--violet)" }}>Flash</span>Learn
            </div>

            {/* Desktop nav */}
            <ul className="home-nav-desktop" style={{
                display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0,
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            }}>
              {[["#features", "Features"], ["#testimonials", "Reviews"], ["#cta", "Pricing"]].map(([href, label]) => (
                <li key={label}>
                  <a href={href} style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.02em", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.target.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.target.style.color = "var(--text-secondary)")}
                  >{label}</a>
                </li>
              ))}
            </ul>

            {/* Desktop CTA */}
            <div className="home-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isAuthenticated ? (
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                        Dashboard →
                    </button>
                ) : (
                    <>
                        <button onClick={login} style={navBtnGhost}>Sign In</button>
                        <button onClick={login} style={navBtnPrimary}>Start Free →</button>
                    </>
                )}
            </div>

            {/* Mobile: Sign in + Hamburger */}
            <div className="home-nav-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isAuthenticated ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </button>
                ) : (
                    <button className="btn btn-primary btn-sm" onClick={login}>
                        Sign In
                    </button>
                )}
                <button
                    onClick={() => setMenuOpen(o => !o)}
                    style={{
                        background: 'none', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)', padding: '6px 8px',
                        cursor: 'pointer', color: 'var(--text-primary)',
                        display: 'flex', flexDirection: 'column', gap: 4,
                    }}
                    aria-label="Toggle menu"
                >
                    {[0, 1, 2].map(i => (
                        <span key={i} style={{
                            display: 'block', width: 18, height: 2,
                            background: 'var(--text-primary)', borderRadius: 2,
                            transition: 'all 200ms ease',
                            transform: menuOpen
                                ? i === 0 ? 'translateY(6px) rotate(45deg)'
                                : i === 2 ? 'translateY(-6px) rotate(-45deg)'
                                : 'scaleX(0)'
                                : 'none',
                        }} />
                    ))}
                </button>
            </div>
        </div>

        {/* Mobile dropdown menu */}
        <div style={{
            maxHeight: menuOpen ? 240 : 0,
            overflow: 'hidden',
            transition: 'max-height 300ms ease',
            borderTop: menuOpen ? '1px solid var(--border-subtle)' : 'none',
            background: 'var(--obsidian)',
        }} className="home-nav-mobile-dropdown">
            {[["#features", "Features"], ["#testimonials", "Reviews"], ["#cta", "Pricing"]].map(([href, label], i) => (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
                    display: 'block', textDecoration: 'none',
                    padding: '14px 24px',
                    borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                    fontSize: 'var(--text-base)', color: 'var(--text-secondary)',
                    cursor: 'pointer',
                }}>
                    {label}
                </a>
            ))}
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", overflow: "hidden" }}>
        {/* left */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "140px 64px 80px 80px", position: "relative", zIndex: 2 }}>
          <div className="hero-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--violet-bright)", marginBottom: 28 }}>
            <span className="eyebrow-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--violet)" }} />
            AI-Powered Learning Platform
          </div>

          <h1 className="hero-title home-hero-title" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(72px,8vw,110px)", lineHeight: 0.92, letterSpacing: "-0.01em", color: "var(--text-primary)", marginBottom: 28 }}>
            Learn<br />
            <span style={{ color: "transparent", WebkitTextStroke: "1.5px var(--violet)", display: "block" }}>Anything.</span>
            Faster.
          </h1>

          <p className="hero-sub" style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 440, lineHeight: 1.7, marginBottom: 40, fontWeight: 300 }}>
            Generate intelligent flashcard decks from your notes, PDFs, and any topic — powered by Gemini AI. Retain more, study less.
          </p>

          <div className="hero-actions" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={login} className="home-cta-btn" style={heroPrimaryBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Generate Free Deck
            </button>
            <button className="home-cta-btn" style={heroSecondaryBtn}>Watch Demo ↗</button>
          </div>

          <div className="hero-stats" style={{ display: "flex", gap: 32, marginTop: 52, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
            {[["40", "K+", "Cards Generated"], ["4", "×", "Faster Retention"], ["98", "%", "Accuracy Rate"]].map(([val, suffix, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
                  {val}<span style={{ color: "var(--violet)" }}>{suffix}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right — 3D flip card */}
        <div className="hero-right" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "140px 80px 80px 0" }}>
          <div className="ambient-glow" style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,110,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

          <DemoFlashCard />
        </div>

        {/* bg grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(42,42,47,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,47,0.15) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)" }} />
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "16px 0", overflow: "hidden", background: "var(--surface)", position: "relative", zIndex: 2 }}>
        <div className="marquee-track" style={{ display: "flex", width: "max-content" }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 40px", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--violet)", flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "140px 0", position: "relative" }}>
        <div className="reveal" style={{ textAlign: "center", padding: "0 80px 80px" }}>
          <span style={eyebrowStyle}>Four Ways to Generate</span>
          <h2 style={sectionTitleStyle}>Your Knowledge.<br />Any Source.</h2>
          <p style={sectionSubStyle}>FlashLearn transforms anything into study material — paste text, upload files, or just name a topic.</p>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 80px" }}>

          {/* Feature 1 */}
          <div className="reveal feature-grid home-feature-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", minHeight: "80vh", padding: "80px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <span style={featureNumberStyle}>01</span>
              <Tag icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}>Text Paste</Tag>
              <h3 style={featureTitleStyle}>Paste.<br />Generate.<br />Done.</h3>
              <p style={featureDescStyle}>Drop in your lecture notes, textbook excerpts, or any body of text. Our AI identifies key concepts and crafts precise question-answer pairs in seconds.</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Supports up to 15,000 characters", "Smart concept extraction", "Up to 20 cards per generation"].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: "var(--violet)", fontSize: 12 }}>→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal reveal-delay-2"><TextPasteVisual /></div>
          </div>

          {/* Feature 2 */}
          <div className="reveal feature-reverse feature-grid home-feature-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", minHeight: "80vh", padding: "80px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <span style={featureNumberStyle}>02</span>
              <Tag icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}>Quiz Mode</Tag>
              <h3 style={featureTitleStyle}>Test Your<br />Knowledge.</h3>
              <p style={featureDescStyle}>Take multiple-choice or typed-answer quizzes across any deck combination. Timer mode, instant feedback, and detailed result reviews keep you sharp.</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Multiple choice + typed answers", "Configurable per-question timers", "Full result breakdown + review"].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: "var(--violet)", fontSize: 12 }}>→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal reveal-delay-2"><QuizVisual /></div>
          </div>

          {/* Feature 3 */}
          <div className="reveal feature-grid home-feature-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", minHeight: "80vh", padding: "80px 0" }}>
            <div>
              <span style={featureNumberStyle}>03</span>
              <Tag icon={<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}>Collections</Tag>
              <h3 style={featureTitleStyle}>Organize<br />Everything.</h3>
              <p style={featureDescStyle}>Group your decks into curated collections — by subject, semester, or study goal. Keep your entire knowledge library structured and instantly accessible.</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Unlimited collections & decks", "Cross-deck quiz sessions", "One-click export & backup"].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Mono', monospace" }}>
                    <span style={{ color: "var(--violet)", fontSize: 12 }}>→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal reveal-delay-2"><CollectionsVisual /></div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: "140px 80px", background: "var(--charcoal)", borderTop: "1px solid var(--border)" }}>
        <div style={{ marginBottom: 64 }}>
          <span style={eyebrowStyle}>Wall of Love</span>
          <h2 style={sectionTitleStyle}>Students Who<br />Actually Pass.</h2>
        </div>

        <div className="masonry">
          {testimonials.map((t, i) => (
            <div key={i} className={`reveal ${i % 3 === 1 ? "reveal-delay-1" : i % 3 === 2 ? "reveal-delay-2" : ""} ${t.featured ? "testimonial-featured" : ""}`}
              style={{
                breakInside: "avoid", background: t.featured ? "linear-gradient(135deg,#1d1d25 0%,#17171f 100%)" : "var(--elevated)",
                border: t.featured ? "1px solid rgba(124,110,247,0.3)" : "1px solid var(--border)",
                borderRadius: 16, padding: 28, marginBottom: 20,
                position: "relative", transition: "transform 0.3s, border-color 0.3s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = t.featured ? "rgba(124,110,247,0.5)" : "var(--border-bright)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = t.featured ? "rgba(124,110,247,0.3)" : "var(--border)"; }}
            >
              <div style={{ color: "var(--warning)", fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>{"★".repeat(t.stars)}{"☆".repeat(5 - t.stars)}</div>
              {(t.topReview || t.featuredLabel) && (
                <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(232,163,32,0.1)", border: "1px solid rgba(232,163,32,0.3)", borderRadius: 20, padding: "2px 8px", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--warning)" }}>
                  {t.topReview ? "Top Review" : t.featuredLabel}
                </div>
              )}
              {t.featured && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 0.8, color: "var(--violet)", opacity: 0.3, marginBottom: 8, display: "block" }}>"</span>}
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 20, fontWeight: 300 }}>{t.quote}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" style={{ padding: "160px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(124,110,247,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <span className="reveal" style={eyebrowStyle}>Free to Start · No Credit Card</span>
        <h2 className="reveal" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(64px,7vw,100px)", lineHeight: 0.93, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 24 }}>
          Start Learning<br />
          <span style={{ color: "var(--violet)" }}>Right Now.</span>
        </h2>
        <p className="reveal" style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto 40px", fontWeight: 300, lineHeight: 1.7 }}>Generate your first AI-powered flashcard deck in under 30 seconds. No setup, no friction.</p>
        <div className="reveal" style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
          <button onClick={login} className="home-cta-btn" style={{ height: 52, padding: "0 32px", background: "var(--violet)", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--violet-bright)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(124,110,247,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--violet)"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Generate Free Deck
          </button>
          <button className="home-cta-btn" style={{ height: 52, padding: "0 32px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 16, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >View Pricing</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "48px 80px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--charcoal)" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.05em" }}>
          <span style={{ color: "var(--violet)" }}>Flash</span>Learn
        </div>
        <ul style={{ display: "flex", gap: 28, listStyle: "none" }}>
          {["Privacy", "Terms", "Contact", "GitHub"].map(link => (
            <li key={link}>
              <a href="#" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseEnter={e => (e.target.style.color = "var(--text-secondary)")}
                onMouseLeave={e => (e.target.style.color = "var(--text-muted)")}
              >{link}</a>
            </li>
          ))}
        </ul>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>© 2026 FlashLearn</div>
      </footer>

    </div>
  );
}

/* ── Shared style objects ── */
const navBtnGhost = { height: 36, padding: "0 18px", borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", transition: "all 0.2s" };
const navBtnPrimary = { height: 36, padding: "0 18px", borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", background: "var(--violet)", color: "#fff", border: "none", transition: "all 0.2s" };
const heroPrimaryBtn = { height: 48, padding: "0 28px", background: "var(--violet)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.25s" };
const heroSecondaryBtn = { height: 48, padding: "0 24px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "all 0.25s" };
const eyebrowStyle = { fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--violet-bright)", marginBottom: 16, display: "block" };
const sectionTitleStyle = { fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px,5vw,72px)", lineHeight: 0.95, letterSpacing: "0.01em", color: "var(--text-primary)", marginBottom: 20 };
const sectionSubStyle = { fontSize: 16, color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto", fontWeight: 300, lineHeight: 1.7 };
const featureNumberStyle = { fontFamily: "'Bebas Neue', sans-serif", fontSize: 120, lineHeight: 1, color: "transparent", WebkitTextStroke: "1px var(--border)", marginBottom: -20, display: "block", userSelect: "none" };
const featureTitleStyle = { fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, lineHeight: 1, color: "var(--text-primary)", letterSpacing: "0.01em", marginBottom: 16 };
const featureDescStyle = { fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.75, fontWeight: 300, marginBottom: 28 };
const chipStyle = { position: "absolute", top: 20, left: 20, background: "var(--violet-dim)", border: "1px solid rgba(124,110,247,0.2)", borderRadius: 6, padding: "4px 10px", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--violet-bright)", textTransform: "uppercase" };
const cardLabelStyle = { fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 20 };