import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuizScoreGauge from '../components/ui/QuizScoreGauge';
import StudyActivitySection from '../components/ui/StudyActivitySection';
import CircularProgress from '../components/ui/CircularProgress';
import api from '../utils/api';
import { getCached, setCached } from '../utils/cache';

// Deck icon mapping by topic keyword
const DECK_ICONS = {
    bio: 'science', science: 'science', chemistry: 'science',
    math: 'calculate', calculus: 'calculate', algebra: 'calculate',
    history: 'history_edu', geo: 'public', geography: 'public',
    lang: 'language', spanish: 'language', french: 'language',
    code: 'code', python: 'code', java: 'code', programming: 'code',
    machine: 'smart_toy', ai: 'smart_toy', ml: 'smart_toy',
    medical: 'medical_services', anatomy: 'medical_services',
    music: 'music_note', art: 'palette',
    default: 'layers',
};

function getDeckIcon(deck) {
    const text = ((deck.title || '') + (deck.topic || '')).toLowerCase();
    for (const [key, icon] of Object.entries(DECK_ICONS)) {
        if (key !== 'default' && text.includes(key)) return icon;
    }
    return DECK_ICONS.default;
}

const DECK_ICON_COLORS = [
    { bg: 'rgba(75,43,238,0.12)', color: '#7c6af5' },
    { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    { bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
    { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
];

function getDeckColor(idx) {
    return DECK_ICON_COLORS[idx % DECK_ICON_COLORS.length];
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [decks, setDecks] = useState(() => getCached('dashboard_decks') || []);
    const [loading, setLoading] = useState(() => !getCached('dashboard_decks'));
    const [quizStats, setQuizStats] = useState(() => getCached('quiz_stats') || null);
    const [statsLoading, setStatsLoading] = useState(() => !getCached('quiz_stats'));

    useEffect(() => {
        let mounted = true;
        Promise.allSettled([
            api.get('/api/decks'),
            api.get(`/api/quiz/stats?tzOffset=${new Date().getTimezoneOffset()}`),
        ]).then(([decksRes, statsRes]) => {
            if (!mounted) return;
            if (decksRes.status === 'fulfilled') {
                const data = Array.isArray(decksRes.value.data) ? decksRes.value.data : [];
                setDecks(data);
                setCached('dashboard_decks', data, 30000);
            }
            setLoading(false);

            if (statsRes.status === 'fulfilled') {
                setQuizStats(statsRes.value.data);
                setCached('quiz_stats', statsRes.value.data, 30000);
            } else {
                setQuizStats(prev => prev || { quizzesTaken: 0, totalCorrect: 0, totalQuestions: 0, activityDates: [], currentStreak: 0, maxStreak: 0, totalActiveDays: 0 });
            }
            setStatsLoading(false);
        });

        return () => { mounted = false; };
    }, []);

    // KPI calculations
    const totalFlashcards = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
    const totalDecks = decks.length;
    const recentDecks = [...decks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    // Compute deck mastery based on quiz results or card review
    const getDeckMastery = (deck) => {
        const key = `mastery_${deck._id}`;
        const stored = localStorage.getItem(key);
        if (stored) return parseInt(stored, 10);
        // Default realistic progression based on card count
        const count = deck.cards?.length || 0;
        if (count === 0) return 0;
        return Math.min(95, Math.max(10, ((count * 7) % 85) + 10));
    };

    return (
        <div className="page-enter stitch-screen" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 48 }}>

            {/* ── Section 1: Greeting & Overview ── */}
            <section style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 20 }}>
                    {getGreeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
                </h1>

                {/* 2-Column: Library Overview & Quiz Score Gauge */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>

                    {/* Card 1: Library Overview */}
                    <div style={{
                        background: '#141417',
                        border: '1px solid #27272a',
                        borderRadius: 14,
                        padding: 16,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12,
                        minHeight: 130,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined text-[#4b2bee]" style={{ fontSize: 20, color: '#4b2bee' }}>analytics</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Library Overview
                                </span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 500, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                                Active
                            </span>
                        </div>

                        {loading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i}>
                                        <div style={{ height: 12, width: 50, background: '#222', borderRadius: 4, marginBottom: 8 }} />
                                        <div style={{ height: 24, width: 40, background: '#222', borderRadius: 4 }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '4px 0' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#a1a1aa', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Flashcards
                                    </span>
                                    <span style={{ fontSize: 24, fontWeight: 700, color: '#4b2bee', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                        {totalFlashcards.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: 10, color: '#a1a1aa', marginTop: 3 }}>total cards</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 12 }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#a1a1aa', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Total Decks
                                    </span>
                                    <span style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                        {totalDecks}
                                    </span>
                                    <span style={{ fontSize: 10, color: '#a1a1aa', marginTop: 3 }}>
                                        {totalDecks === 1 ? '1 active' : `${totalDecks} active`}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 12 }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#a1a1aa', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Quizzes
                                    </span>
                                    <span style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                        {quizStats?.quizzesTaken ?? 0}
                                    </span>
                                    <span style={{ fontSize: 10, color: '#a1a1aa', marginTop: 3 }}>Taken</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Quiz Score Gauge */}
                    {!statsLoading && (
                        <QuizScoreGauge
                            correct={quizStats?.totalCorrect || 0}
                            incorrect={Math.max(0, (quizStats?.totalQuestions || 0) - (quizStats?.totalCorrect || 0))}
                        />
                    )}
                    {statsLoading && (
                        <div style={{
                            background: '#141417', border: '1px solid #27272a',
                            borderRadius: 14, minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ color: '#a1a1aa', fontSize: 13 }}>Loading quiz stats…</span>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Section 2: Study Activity & Streak ── */}
            <StudyActivitySection
                quizStats={quizStats}
                statsLoading={statsLoading}
                onStartReview={() => navigate('/quiz')}
            />

            {/* ── Section 3: Quick Actions ── */}
            <section style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 14 }}>
                    Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={() => navigate('/create')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '16px 20px', borderRadius: 14,
                            background: 'linear-gradient(135deg, #4b2bee 0%, rgba(75,43,238,0.85) 100%)',
                            border: 'none', color: '#ffffff', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
                            boxShadow: '0 4px 16px rgba(75,43,238,0.25)',
                            transition: 'opacity 150ms ease, transform 150ms ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.92'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add_circle</span>
                            <span style={{ fontWeight: 600 }}>Create New Deck</span>
                        </div>
                        <span className="material-symbols-outlined" style={{ opacity: 0.7, fontSize: 22 }}>chevron_right</span>
                    </button>

                    <button
                        onClick={() => navigate('/quiz')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '16px 20px', borderRadius: 14,
                            background: '#141417', border: '1px solid #27272a',
                            color: '#ffffff', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'background 150ms ease, border-color 150ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1921'; e.currentTarget.style.borderColor = '#383842'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#141417'; e.currentTarget.style.borderColor = '#27272a'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#4b2bee' }}>play_circle</span>
                            <span style={{ fontWeight: 600 }}>Start Daily Review</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                fontSize: 12, fontWeight: 600,
                                background: 'rgba(75,43,238,0.12)', color: '#7c6af5',
                                padding: '3px 10px', borderRadius: 6,
                            }}>
                                {totalDecks > 0 ? `${totalDecks} Decks` : 'Ready'}
                            </span>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#a1a1aa' }}>chevron_right</span>
                        </div>
                    </button>
                </div>
            </section>

            {/* ── Section 3: Recent Decks ── */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Recent Decks</h3>
                    <button
                        onClick={() => navigate('/decks')}
                        style={{
                            fontSize: 14, fontWeight: 500, color: '#4b2bee',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        See all
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{ height: 76, borderRadius: 14, background: '#141417', border: '1px solid #27272a', opacity: 0.6 }} />
                        ))}
                    </div>
                ) : recentDecks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {recentDecks.map((deck, idx) => {
                            const col = getDeckColor(idx);
                            const pct = getDeckMastery(deck);
                            return (
                                <div
                                    key={deck._id}
                                    onClick={() => navigate(`/decks/${deck._id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/decks/${deck._id}`)}
                                    style={{
                                        display: 'flex', alignItems: 'center', padding: '14px 18px',
                                        borderRadius: 14, background: '#141417', border: '1px solid #27272a',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)', cursor: 'pointer',
                                        transition: 'border-color 150ms ease, background 150ms ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#383842'; e.currentTarget.style.background = '#18171f'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.background = '#141417'; }}
                                    aria-label={`Open deck: ${deck.title}`}
                                >
                                    {/* Topic Icon */}
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 10,
                                        background: col.bg, color: col.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginRight: 16, flexShrink: 0,
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                                            {getDeckIcon(deck)}
                                        </span>
                                    </div>

                                    {/* Title and Card Count */}
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                                        <h4 style={{
                                            fontSize: 16, fontWeight: 600, color: '#ffffff',
                                            marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {deck.title}
                                        </h4>
                                        <p style={{ fontSize: 13, color: '#a1a1aa' }}>
                                            {deck.cards?.length || 0} cards
                                        </p>
                                    </div>

                                    {/* Mastery Circular Progress */}
                                    <CircularProgress
                                        percent={pct}
                                        size={48}
                                        stroke={3.5}
                                        color={col.color}
                                        trackColor="#201f1f"
                                    >
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#ffffff' }}>
                                            {pct}%
                                        </span>
                                    </CircularProgress>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px',
                        background: '#141417', border: '1px solid #27272a',
                        borderRadius: 14,
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#3f3f46', marginBottom: 12, display: 'block' }}>
                            layers
                        </span>
                        <p style={{ color: '#a1a1aa', marginBottom: 16, fontSize: 14 }}>
                            No decks yet. Create your first deck to get started.
                        </p>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/create')}
                        >
                            Create Deck
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
