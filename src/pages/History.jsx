import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getDeckReadPercentage } from '../utils/deckProgress';

const DECK_ICONS = {
    bio: { icon: 'biotech', bg: 'rgba(75,43,238,0.12)', color: '#7c6af5' },
    science: { icon: 'science', bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    chemistry: { icon: 'science', bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    math: { icon: 'calculate', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    history: { icon: 'history_edu', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    geo: { icon: 'public', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    geography: { icon: 'public', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    lang: { icon: 'translate', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    spanish: { icon: 'translate', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    french: { icon: 'translate', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    code: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    python: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    java: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    programming: { icon: 'code', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    machine: { icon: 'smart_toy', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    ai: { icon: 'smart_toy', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
    medical: { icon: 'medical_services', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
};

const FALLBACK_COLORS = [
    { bg: 'rgba(75,43,238,0.12)', color: '#7c6af5' },
    { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
    { bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    { bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
];

function getDeckStyle(item, idx) {
    const text = ((item.title || '') + (item.topic || '')).toLowerCase();
    for (const [key, style] of Object.entries(DECK_ICONS)) {
        if (text.includes(key)) return style;
    }
    const fb = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    return { icon: item.icon || 'layers', ...fb };
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        api.get('/api/decks')
            .then(({ data }) => {
                if (!mounted) return;
                const decks = Array.isArray(data) ? data : (data?.items || []);
                setHistory(
                    decks
                        .map((deck) => ({
                            id: deck._id,
                            type: 'deck_created',
                            title: deck.title,
                            topic: deck.topic || 'General',
                            cardCount: deck.cards?.length || 0,
                            mastery: getDeckReadPercentage(deck),
                            createdAt: deck.createdAt,
                            timeAgo: formatTimeAgo(deck.createdAt),
                        }))
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                );
            })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const filtered = history.filter((item) => {
        const matchesFilter =
            filter === 'all' ||
            (filter === 'quiz' && item.type === 'quiz_taken') ||
            (filter === 'deck' && item.type === 'deck_created');
        const matchesSearch =
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.topic.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const clearHistory = () => {
        if (window.confirm('Clear your local learning history?')) {
            setHistory([]);
        }
    };

    return (
        <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 28 }}>history</span>
                        Learning History
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Track your study sessions, completed quizzes, and created decks
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input"
                            style={{ paddingLeft: 38, width: 220, height: 38, fontSize: 13 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 4, background: '#1c1c22', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'quiz', label: 'Quizzes' },
                            { key: 'deck', label: 'Decks' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                style={{
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    background: filter === tab.key ? 'var(--accent)' : 'transparent',
                                    color: filter === tab.key ? '#fff' : 'var(--text-secondary)',
                                    transition: 'background 150ms ease',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {history.length > 0 && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={clearHistory}
                            title="Clear learning history"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_sweep</span>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 20px', border: '1px dashed var(--border-subtle)', borderRadius: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--border-subtle)', marginBottom: 12, display: 'block' }}>
                        history_toggle_off
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                        {history.length === 0 ? 'No history yet' : 'No matching records'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                        {history.length === 0
                            ? 'Create a deck or take a quiz and it will show up here.'
                            : 'Try a different search or filter.'}
                    </p>
                    {history.length === 0 && (
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>Create Deck</button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {filtered.map((item, idx) => {
                        const style = getDeckStyle(item, idx);
                        const accuracyVal = item.mastery ?? 0;
                        return (
                            <div
                                key={item.id}
                                className="stitch-deck-grid-card"
                                onClick={() => navigate(item.type === 'deck_created' ? `/decks/${item.id}` : '/quiz')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(item.type === 'deck_created' ? `/decks/${item.id}` : '/quiz')}
                                aria-label={`Open: ${item.title}`}
                            >
                                <div className="stitch-deck-grid-card-body">
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div
                                            className="stitch-deck-icon-wrap"
                                            style={{ background: style.bg, color: style.color }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{style.icon}</span>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                background: item.type === 'deck_created' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                color: item.type === 'deck_created' ? '#818cf8' : '#34d399',
                                            }}
                                        >
                                            {item.type === 'deck_created' ? 'Deck Created' : 'Quiz Taken'}
                                        </span>
                                    </div>

                                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>{item.title}</h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        {item.type === 'deck_created' ? `${item.cardCount} Cards` : `Score: ${item.score}`} • {item.timeAgo}
                                    </p>
                                </div>

                                <div className="stitch-deck-grid-card-footer">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                        <span>{item.type === 'deck_created' ? 'Mastery' : 'Accuracy'}</span>
                                        <span>{accuracyVal}%</span>
                                    </div>
                                    <div className="stitch-mastery-bar">
                                        <div className="stitch-mastery-fill" style={{ width: `${accuracyVal}%`, background: style.color }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
