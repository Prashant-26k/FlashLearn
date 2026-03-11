import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FlashCard from '../components/FlashCard';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function DeckStudy() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => {
        loadDeck();
    }, [id]);

    const loadDeck = async () => {
        try {
            const res = await api.get(`/api/decks/${id}`);
            setDeck(res.data);
            setTitle(res.data.title);
        } catch {
            toast.error('Failed to load deck');
        }
        setLoading(false);
    };

    const handleKeyDown = useCallback((e) => {
        if (!deck?.cards?.length) return;
        // Ignore if user is typing in an input or textarea
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === 'ArrowLeft') {
            setFlipped(false);
            setCurrentCard(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
            setFlipped(false);
            setCurrentCard(prev => Math.min(deck.cards.length - 1, prev + 1));
        } else if (e.key === ' ') {
            e.preventDefault();
            setFlipped(prev => !prev);
        }
    }, [deck, currentCard]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleTitleSave = async () => {
        setEditingTitle(false);
        if (title !== deck.title) {
            try {
                await api.put(`/api/decks/${id}`, { ...deck, title });
                setDeck({ ...deck, title });
            } catch {
                toast.error('Failed to update title');
            }
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get(`/api/export/${id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${deck?.title || 'deck'}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Exported!');
        } catch {
            toast.error('Export failed');
        }
    };

    if (loading) {
        return (
            <div className="page-enter" style={{ padding: 32 }}>
                <SkeletonLine width="40%" height={28} style={{ marginBottom: 24 }} />
                <div className="skeleton" style={{ width: 520, height: 300, margin: '0 auto', borderRadius: 12 }} />
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="page-enter" style={{ textAlign: 'center', padding: 64 }}>
                <p style={{ color: 'var(--text-secondary)' }}>Deck not found</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/decks')}>
                    Back to Decks
                </button>
            </div>
        );
    }

    const cards = deck.cards || [];
    const progress = cards.length > 0 ? ((currentCard + 1) / cards.length) * 100 : 0;

    return (
        <div className="page-enter">
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/decks')} style={{ fontSize: 18 }}>←</button>
                    {editingTitle ? (
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                            autoFocus
                            style={{ fontSize: 'var(--text-xl)', fontWeight: 700, width: 300 }}
                        />
                    ) : (
                        <h1
                            style={{ fontSize: 'var(--text-xl)', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => setEditingTitle(true)}
                            title="Click to edit"
                        >
                            {deck.title}
                        </h1>
                    )}
                    <span className="badge badge-violet">{cards.length} cards</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={handleExport}>Export</button>
                    <button className="btn btn-primary" onClick={() => navigate(`/quiz?deckId=${id}`)}>
                        Start Quiz
                    </button>
                </div>
            </div>

             <div className="deck-study-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32 }}>
                {/* Main study area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {cards.length > 0 ? (
                        <>
                            <FlashCard
                                key={currentCard}
                                question={cards[currentCard]?.question}
                                answer={cards[currentCard]?.answer}
                                flipped={flipped}
                                onFlip={setFlipped}
                            />

                            {/* Keyboard shortcuts hint */}
                            <p style={{
                                color: 'var(--text-muted)', fontSize: 12, marginTop: 16, textAlign: 'center',
                            }}>
                                Space to flip &nbsp;·&nbsp; ← Prev &nbsp;·&nbsp; → Next
                            </p>

                            {/* Progress bar */}
                            <div className="progress-bar" style={{ marginTop: 16, maxWidth: 520 }}>
                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>

                            {/* Nav buttons */}
                            <div style={{ display: 'flex', gap: 16, marginTop: 20, alignItems: 'center' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setFlipped(false);
                                        setCurrentCard(Math.max(0, currentCard - 1));
                                    }}
                                    disabled={currentCard === 0}
                                >
                                    ← Prev
                                </button>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    {currentCard + 1} / {cards.length}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setFlipped(false);
                                        setCurrentCard(Math.min(cards.length - 1, currentCard + 1));
                                    }}
                                    disabled={currentCard === cards.length - 1}
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', padding: 64 }}>This deck has no cards.</p>
                    )}
                </div>

                {/* Right sidebar - card list */}
                <div className="deck-study-sidebar"
                    style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    padding: 16,
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                }}>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
                        Cards ({cards.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {cards.map((card, i) => (
                            <div
                                key={i}
                                onClick={() => {
                                    setFlipped(false);
                                    setCurrentCard(i);
                                }}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    background: i === currentCard ? 'var(--bg-elevated)' : 'transparent',
                                    borderLeft: i === currentCard ? '2px solid var(--accent)' : '2px solid transparent',
                                    transition: 'all 150ms ease',
                                }}
                            >
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: 6 }}>
                                    {i + 1}
                                </span>
                                <span style={{
                                    fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 160,
                                }}>
                                    {card.question}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
