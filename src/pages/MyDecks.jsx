import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonGrid } from '../components/Skeleton';
import Modal from '../components/Modal';
import { useToast } from '../context/useToast';
import api from '../utils/api';
import { getCached, setCached, invalidateCache } from '../utils/cache';

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

function getDeckStyle(deck, idx) {
    const text = ((deck.title || '') + (deck.topic || '')).toLowerCase();
    for (const [key, style] of Object.entries(DECK_ICONS)) {
        if (text.includes(key)) return style;
    }
    const fb = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    return { icon: 'layers', ...fb };
}

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'recent', label: 'Recent' },
    { key: 'large', label: 'Most Cards' },
];

export default function MyDecks() {
    const [decks, setDecks] = useState(() => getCached('decks') || []);
    const [loading, setLoading] = useState(() => !getCached('decks'));
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    const reloadDecks = async () => {
        try {
            const res = await api.get('/api/decks');
            const data = Array.isArray(res.data) ? res.data : [];
            setDecks(data);
            setCached('decks', data, 60000);
        } catch { /* backend not running */ }
    };

    useEffect(() => {
        let mounted = true;
        api.get('/api/decks')
            .then(res => {
                if (!mounted) return;
                const data = Array.isArray(res.data) ? res.data : [];
                setDecks(data);
                setCached('decks', data, 60000);
            })
            .catch(() => {})
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => setMenuOpen(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const handleDelete = async () => {
        try {
            await api.delete(`/api/decks/${deleteId}`);
            invalidateCache('decks');
            invalidateCache('dashboard_decks');
            setDecks(decks.filter(d => d._id !== deleteId));
            toast.success('Deck deleted');
        } catch {
            toast.error('Failed to delete deck');
        }
        setDeleteId(null);
    };

    const handleDuplicate = async (deck) => {
        try {
            await api.post('/api/decks', {
                title: `${deck.title} (Copy)`,
                topic: deck.topic,
                cards: deck.cards,
            });
            invalidateCache('decks');
            invalidateCache('dashboard_decks');
            toast.success('Deck duplicated');
            reloadDecks();
        } catch {
            toast.error('Failed to duplicate');
        }
    };

    const handleExport = async (deckId) => {
        try {
            const res = await api.get(`/api/export/${deckId}`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'deck-export.txt';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Deck exported');
        } catch {
            toast.error('Failed to export');
        }
    };

    const filteredDecks = decks
        .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (filter === 'large') return (b.cards?.length || 0) - (a.cards?.length || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    return (
        <div className="page-enter stitch-screen">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.03em' }}>My Decks</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/create')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    New Deck
                </button>
            </div>

            {/* Search */}
            <div className="stitch-search-row">
                <span className="material-symbols-outlined">search</span>
                <input
                    className="input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search decks..."
                    aria-label="Search decks"
                />
            </div>

            {/* Filter Pills */}
            <div className="pill-tabs">
                {FILTERS.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`pill-tab ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <SkeletonGrid count={6} />
            ) : filteredDecks.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {filteredDecks.map((deck, idx) => {
                        const style = getDeckStyle(deck, idx);
                        return (
                            <div
                                key={deck._id}
                                className="stitch-deck-grid-card"
                                onClick={() => navigate(`/decks/${deck._id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/decks/${deck._id}`)}
                                aria-label={`Open deck: ${deck.title}`}
                            >
                                <div className="stitch-deck-grid-card-body">
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                        {/* Icon tile */}
                                        <div
                                            className="stitch-deck-icon-wrap"
                                            style={{ background: style.bg, color: style.color }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{style.icon}</span>
                                        </div>
                                        {/* Menu */}
                                        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpen(menuOpen === deck._id ? null : deck._id);
                                                }}
                                                style={{ padding: '0 4px', color: 'var(--text-muted)' }}
                                                aria-label="Deck options"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
                                            </button>
                                            {menuOpen === deck._id && (
                                                <div className="dropdown">
                                                    <button className="dropdown-item" onClick={() => { navigate(`/decks/${deck._id}`); setMenuOpen(null); }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span> Edit
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => { handleDuplicate(deck); setMenuOpen(null); }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>content_copy</span> Duplicate
                                                    </button>
                                                    <button className="dropdown-item" onClick={() => { handleExport(deck._id); setMenuOpen(null); }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>file_download</span> Export
                                                    </button>
                                                    <div className="dropdown-divider" />
                                                    <button className="dropdown-item danger" onClick={() => { setDeleteId(deck._id); setMenuOpen(null); }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>{deck.title}</h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deck.cards?.length || 0} Cards</p>
                                </div>

                                {/* Mastery Bar */}
                                <div className="stitch-deck-grid-card-footer">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                        <span>Mastery</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="stitch-mastery-bar">
                                        <div className="stitch-mastery-fill" style={{ width: '0%', background: style.color }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', padding: '64px 24px',
                    background: '#17171c', border: '1px solid var(--border-subtle)', borderRadius: 14,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--border-subtle)', marginBottom: 16, display: 'block' }}>layers</span>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
                        {search ? `No decks matching "${search}"` : 'No decks yet. Create your first.'}
                    </p>
                    {!search && <button className="btn btn-primary" onClick={() => navigate('/create')}>Create Deck</button>}
                </div>
            )}

            {/* Delete confirmation */}
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Delete Deck"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    </>
                }
            >
                Are you sure you want to delete this deck? This action cannot be undone.
            </Modal>
        </div>
    );
}
