import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonGrid } from '../components/Skeleton';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { getCached, setCached, invalidateCache } from '../utils/cache';

export default function MyDecks() {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [menuOpen, setMenuOpen] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => { loadDecks(); }, []);

    const loadDecks = async () => {
        const cached = getCached('decks');
        if (cached) {
            setDecks(cached);
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/api/decks');
            setDecks(res.data || []);
            setCached('decks', res.data || [], 60000);
        } catch { /* backend not running */ }
        setLoading(false);
    };

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
            loadDecks();
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

    const filteredDecks = decks.filter(d => {
        if (filter === 'recent') return true; // already sorted by date
        return true;
    }).sort((a, b) => {
        if (filter === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
        if (filter === 'topic') return (a.topic || '').localeCompare(b.topic || '');
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>My Decks</h1>
                <button className="btn btn-primary" onClick={() => navigate('/create')}>+ New Deck</button>
            </div>

            {/* Filter Pills */}
            <div className="pill-tabs">
                {[['all', 'All'], ['recent', 'Recent'], ['topic', 'By Topic']].map(([key, label]) => (
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
            {loading ? <SkeletonGrid count={6} /> : filteredDecks.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {filteredDecks.map(deck => (
                        <div
                            key={deck._id}
                            className="deck-card"
                            onClick={() => navigate(`/decks/${deck._id}`)}
                            style={{ position: 'relative' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 4 }}>
                                    {deck.title}
                                </h3>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === deck._id ? null : deck._id); }}
                                        style={{ padding: '0 4px', fontSize: 16 }}
                                    >
                                        ⋯
                                    </button>
                                    {menuOpen === deck._id && (
                                        <div className="dropdown" style={{ top: '100%', right: 0 }}>
                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate(`/decks/${deck._id}`); setMenuOpen(null); }}>
                                                Edit
                                            </button>
                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleDuplicate(deck); setMenuOpen(null); }}>
                                                Duplicate
                                            </button>
                                            <button className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleExport(deck._id); setMenuOpen(null); }}>
                                                Export
                                            </button>
                                            <div className="dropdown-divider" />
                                            <button className="dropdown-item danger" onClick={(e) => { e.stopPropagation(); setDeleteId(deck._id); setMenuOpen(null); }}>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                {deck.cards?.length || 0} cards
                            </span>
                            {deck.topic && (
                                <div style={{ marginTop: 8 }}>
                                    <span className="badge">{deck.topic}</span>
                                </div>
                            )}
                            <div style={{ marginTop: 8 }}>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                    {deck.createdAt ? new Date(deck.createdAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', padding: '64px 0',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>▤</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No decks yet. Create your first.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/create')}>Create Deck</button>
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
