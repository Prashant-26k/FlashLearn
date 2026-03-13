import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        if (isAuthenticated) {
            navigate(`/create?topic=${encodeURIComponent(topic.trim())}`);
        } else {
            login();
        }
    };

    const handleAction = (path) => {
        if (isAuthenticated) navigate(path);
        else login();
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0F0F10', color: '#F0F0F2', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

            {/* ── Navbar ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: scrolled ? 'rgba(15,15,16,0.92)' : 'rgba(15,15,16,0.7)',
                backdropFilter: 'blur(16px)',
                transition: 'background 300ms ease',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: '#5E6AD2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                            <span style={{ color: '#5E6AD2' }}>Flash</span>
                            <span style={{ color: '#F0F0F2' }}>Learn</span>
                        </span>
                    </div>

                    {/* Nav links - desktop */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
                        {['Features', 'How It Works'].map(label => (
                            <a key={label} href={`#${label.toLowerCase().replace(/ /g, '-')}`}
                                style={{ fontSize: 14, fontWeight: 500, color: '#8A8A96', textDecoration: 'none', transition: 'color 150ms' }}
                                onMouseEnter={e => e.target.style.color = '#F0F0F2'}
                                onMouseLeave={e => e.target.style.color = '#8A8A96'}
                            >{label}</a>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isAuthenticated ? (
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{ background: '#5E6AD2', color: '#fff', border: 'none', borderRadius: 99, height: 40, padding: '0 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(94,106,210,0.3)', transition: 'all 150ms' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#7B84E0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#5E6AD2'}
                            >Dashboard →</button>
                        ) : (
                            <>
                                <button onClick={login} style={{ background: 'transparent', border: 'none', color: '#8A8A96', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '0 12px', transition: 'color 150ms' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#F0F0F2'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#8A8A96'}
                                >Sign In</button>
                                <button onClick={login}
                                    style={{ background: '#5E6AD2', color: '#fff', border: 'none', borderRadius: 99, height: 40, padding: '0 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(94,106,210,0.3)', transition: 'all 150ms' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#7B84E0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#5E6AD2'}
                                >Get Started</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {/* ── Hero ── */}
                <section id="features" style={{ position: 'relative', padding: '96px 24px 80px', textAlign: 'center' }}>
                    {/* Radial glow */}
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 800px 500px at 50% 0%, rgba(94,106,210,0.13), transparent 70%)', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                        {/* Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 99, background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)', color: '#7B84E0', fontSize: 12, fontWeight: 700, marginBottom: 32, letterSpacing: '0.05em' }}>
                            <span style={{ position: 'relative', display: 'inline-flex' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5E6AD2', display: 'block' }} />
                                <span style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: 'rgba(94,106,210,0.5)', animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                            </span>
                            NEW: PDF TO FLASHCARDS v2.0
                        </div>

                        {/* Headline */}
                        <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 24, color: '#F0F0F2' }}>
                            Learn anything,{' '}
                            <span style={{ background: 'linear-gradient(135deg, #5E6AD2 0%, #a5aff7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                faster than ever.
                            </span>
                        </h1>

                        <p style={{ fontSize: 18, color: '#8A8A96', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.6 }}>
                            Generate AI-powered flashcards from your notes, PDFs, or any topic. Study smarter with our intelligent retention system.
                        </p>

                        {/* Search bar */}
                        <form onSubmit={handleGenerate} style={{ maxWidth: 640, margin: '0 auto 32px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: 6, borderRadius: 16,
                                background: '#1E1E21', border: '1px solid #2A2A2E',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                                transition: 'border-color 200ms, box-shadow 200ms',
                            }}
                                onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(94,106,210,0.5)'; e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.4), 0 0 0 3px rgba(94,106,210,0.15)'; }}
                                onBlurCapture={e => { e.currentTarget.style.borderColor = '#2A2A2E'; e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.4)'; }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525C" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 12, flexShrink: 0 }}>
                                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="Enter a topic or paste your notes..."
                                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F0F0F2', fontSize: 16, fontFamily: "'DM Sans', sans-serif", padding: '12px 4px' }}
                                />
                                <button type="submit" style={{
                                    background: '#5E6AD2', color: '#fff', border: 'none',
                                    borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                    boxShadow: '0 4px 16px rgba(94,106,210,0.35)',
                                    transition: 'all 150ms',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#7B84E0'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#5E6AD2'; e.currentTarget.style.transform = 'scale(1)'; }}
                                >Generate</button>
                            </div>
                        </form>

                        {/* Social proof strip */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#52525C', fontSize: 13 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#52525C"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                Gemini AI Powered
                            </span>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2A2A2E' }} />
                            <span>4 Input Methods</span>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2A2A2E' }} />
                            <span>Instant Decks</span>
                        </div>
                    </div>
                </section>

                {/* ── Feature Cards ── */}
                <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        {[
                            { icon: '📝', label: 'Text Paste', color: '#5E6AD2', desc: 'Paste lecture notes or articles to instantly extract key concepts and facts.', path: '/create' },
                            { icon: '📄', label: 'PDF Upload', color: '#E05252', desc: `Upload textbooks or research papers — we'll extract the essentials.`, path: '/create' },
                            { icon: '📘', label: 'Word Docs', color: '#5E6AD2', desc: 'Import structured .docx documents directly into interactive study decks.', path: '/create' },
                            { icon: '🔍', label: 'Topic Search', color: '#E8A320', desc: 'Enter any subject and let AI generate a comprehensive deck from scratch.', path: '/create' },
                        ].map(({ icon, label, color, desc, path }) => (
                            <div key={label}
                                onClick={() => handleAction(path)}
                                style={{ padding: 24, borderRadius: 16, border: '1px solid #2A2A2E', background: 'rgba(30,30,33,0.3)', transition: 'all 200ms', cursor: 'pointer', borderTop: `3px solid ${color}` }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,30,33,0.7)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,30,33,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ fontSize: 28, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'rgba(94,106,210,0.08)', borderRadius: 12, border: '1px solid rgba(94,106,210,0.15)' }}>
                                    {icon}
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F2', marginBottom: 8 }}>{label}</h3>
                                <p style={{ fontSize: 13, color: '#8A8A96', lineHeight: 1.6 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section id="how-it-works" style={{ padding: '80px 24px', background: 'rgba(30,30,33,0.2)', borderTop: '1px solid #2A2A2E', borderBottom: '1px solid #2A2A2E' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 64 }}>
                            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#F0F0F2', marginBottom: 12, letterSpacing: '-0.02em' }}>How It Works</h2>
                            <p style={{ color: '#8A8A96', fontSize: 15 }}>Master any subject in three simple steps.</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 48, position: 'relative' }}>
                            {[
                                { n: '1', title: 'Input Content', desc: 'Upload documents or describe a topic you want to master.' },
                                { n: '2', title: 'AI Generation', desc: 'Our AI analyzes context to create optimal Q&A pairs.' },
                                { n: '3', title: 'Study & Retain', desc: 'Review cards, quiz yourself, and lock in long-term memory.' },
                            ].map(({ n, title, desc }, i) => (
                                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 240 }}>
                                        <div style={{
                                            width: 64, height: 64, borderRadius: '50%',
                                            background: '#0F0F10', border: '2px solid #5E6AD2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 22, fontWeight: 700, color: '#5E6AD2',
                                            marginBottom: 24,
                                            boxShadow: '0 0 24px rgba(94,106,210,0.3)',
                                        }}>{n}</div>
                                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F2', marginBottom: 8 }}>{title}</h4>
                                        <p style={{ fontSize: 13, color: '#8A8A96', lineHeight: 1.6 }}>{desc}</p>
                                    </div>
                                    {i < 2 && (
                                        <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, #2A2A2E, #3D3D44, #2A2A2E)', flexShrink: 0, display: 'none' }} className="step-connector" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Quick Access Cards ── */}
                <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                        {/* Collections */}
                        <div
                            onClick={() => handleAction('/collections')}
                            style={{ position: 'relative', borderRadius: 16, border: '1px solid #2A2A2E', background: 'rgba(30,30,33,0.4)', overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#3D3D44'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#2A2A2E'; }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#5E6AD2' }} />
                            <div style={{ padding: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                                    <div>
                                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F2', marginBottom: 8 }}>Collections</h3>
                                        <p style={{ fontSize: 13, color: '#8A8A96' }}>Organize your study material by courses or projects.</p>
                                    </div>
                                    <span style={{ fontSize: 28, opacity: 0.7 }}>◫</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { letter: 'M', label: 'Microbiology 101', count: '142 cards', color: '#5E6AD2' },
                                        { letter: 'A', label: 'Advanced Calculus', count: '89 cards', color: '#7B84E0' },
                                    ].map(({ letter, label, count, color }) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ width: 36, height: 36, background: `${color}22`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color, fontSize: 14 }}>{letter}</div>
                                            <span style={{ color: '#F0F0F2', fontSize: 13 }}>{label}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#52525C' }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quiz Mode */}
                        <div
                            onClick={() => handleAction('/quiz')}
                            style={{ position: 'relative', borderRadius: 16, border: '1px solid #2A2A2E', background: 'rgba(30,30,33,0.4)', overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#3D3D44'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#2A2A2E'; }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#4CAF82' }} />
                            <div style={{ padding: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                                    <div>
                                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F2', marginBottom: 8 }}>Quiz Mode</h3>
                                        <p style={{ fontSize: 13, color: '#8A8A96' }}>Test your knowledge with adaptive AI-generated quizzes.</p>
                                    </div>
                                    <span style={{ fontSize: 28, opacity: 0.7 }}>◈</span>
                                </div>
                                <div style={{ borderRadius: 12, background: 'linear-gradient(135deg, rgba(76,175,130,0.08), transparent)', border: '1px solid rgba(76,175,130,0.2)', padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4CAF82', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Streak</span>
                                        <span style={{ fontWeight: 700, color: '#4CAF82', fontSize: 15 }}>12 Days 🔥</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                                        <div style={{ width: '75%', height: '100%', background: '#4CAF82', borderRadius: 3 }} />
                                    </div>
                                    <p style={{ fontSize: 12, color: '#52525C' }}>You're in the top 5% of learners this week.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Final CTA ── */}
                <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{
                        borderRadius: 24, background: '#161618', border: '1px solid #2A2A2E',
                        padding: 'clamp(48px, 8vw, 80px) 32px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 300px at 50% 0%, rgba(94,106,210,0.07), transparent)', pointerEvents: 'none' }} />
                        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
                            <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, color: '#F0F0F2', marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                Start mastering your subjects today
                            </h2>
                            <p style={{ color: '#8A8A96', marginBottom: 40, fontSize: 16, lineHeight: 1.6 }}>
                                Join thousands of students using FlashLearn to accelerate their learning with AI-powered flashcards.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                                <button
                                    onClick={() => handleAction('/create')}
                                    style={{ background: '#5E6AD2', color: '#fff', border: 'none', borderRadius: 12, height: 52, padding: '0 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(94,106,210,0.35)', transition: 'all 150ms' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#7B84E0'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#5E6AD2'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    Create a Deck
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                                <button
                                    onClick={() => handleAction('/quiz')}
                                    style={{ background: 'rgba(255,255,255,0.05)', color: '#F0F0F2', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, height: 52, padding: '0 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >Try Quiz Mode</button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer style={{ borderTop: '1px solid #2A2A2E', background: '#0F0F10', padding: '64px 24px 32px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, marginBottom: 48 }}>
                        <div style={{ gridColumn: 'span 1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <div style={{ width: 24, height: 24, background: '#5E6AD2', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 700 }}>
                                    <span style={{ color: '#5E6AD2' }}>Flash</span><span style={{ color: '#F0F0F2' }}>Learn</span>
                                </span>
                            </div>
                            <p style={{ color: '#52525C', fontSize: 13, lineHeight: 1.7, maxWidth: 220 }}>
                                An AI-first learning tool designed to help you synthesize information faster and remember it longer.
                            </p>
                        </div>
                        {[
                            { title: 'Product', links: ['Features', 'Pricing', 'Changelog'] },
                            { title: 'Resources', links: ['Blog', 'API Docs', 'Guide'] },
                            { title: 'Legal', links: ['Privacy', 'Terms', 'Contact'] },
                        ].map(({ title, links }) => (
                            <div key={title}>
                                <h4 style={{ color: '#F0F0F2', fontWeight: 700, fontSize: 13, marginBottom: 20 }}>{title}</h4>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {links.map(link => (
                                        <li key={link}>
                                            <a href="#" style={{ color: '#52525C', fontSize: 13, textDecoration: 'none', transition: 'color 150ms' }}
                                                onMouseEnter={e => e.target.style.color = '#5E6AD2'}
                                                onMouseLeave={e => e.target.style.color = '#52525C'}
                                            >{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <p style={{ color: '#52525C', fontSize: 12 }}>© 2024 FlashLearn AI. All rights reserved.</p>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {['Privacy', 'Terms'].map(t => (
                                <a key={t} href="#" style={{ color: '#52525C', fontSize: 12, textDecoration: 'none', transition: 'color 150ms' }}
                                    onMouseEnter={e => e.target.style.color = '#8A8A96'}
                                    onMouseLeave={e => e.target.style.color = '#52525C'}
                                >{t}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                @media (min-width: 768px) {
                    .step-connector { display: block !important; }
                    .desktop-nav { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
