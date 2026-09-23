import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { getCached, setCached, invalidateCache } from '../utils/cache';

export default function DeckStudy() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [deck, setDeck] = useState(() => getCached(`deck_${id}`) || null);
    const [loading, setLoading] = useState(() => !getCached(`deck_${id}`));
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(() => getCached(`deck_${id}`)?.title || '');

    useEffect(() => {
        let mounted = true;
        api.get(`/api/decks/${id}`)
            .then(res => {
                if (!mounted) return;
                setDeck(res.data);
                setTitle(res.data.title);
                setCached(`deck_${id}`, res.data, 120000);
            })
            .catch(() => {
                if (mounted) toast.error('Failed to load deck');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [id, toast]);

    // Keyboard shortcuts: Space=flip, ←=prev, →=next
    const handleKeyDown = useCallback((e) => {
        if (!deck?.cards?.length) return;
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
    }, [deck]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleTitleSave = async () => {
        setEditingTitle(false);
        if (title !== deck.title) {
            try {
                const newDeck = { ...deck, title };
                await api.put(`/api/decks/${id}`, newDeck);
                setDeck(newDeck);
                invalidateCache(`deck_${id}`);
                invalidateCache('decks');
                invalidateCache('dashboard_decks');
                toast.success('Title updated');
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

    const handleAddCard = async () => {
        if (!deck) return;
        const question = window.prompt('Question:');
        if (!question?.trim()) return;
        const answer = window.prompt('Answer:');
        if (!answer?.trim()) return;
        try {
            const newDeck = { ...deck, cards: [...deck.cards, { question: question.trim(), answer: answer.trim() }] };
            await api.put(`/api/decks/${id}`, newDeck);
            setDeck(newDeck);
            invalidateCache(`deck_${id}`);
            setCurrentCard(newDeck.cards.length - 1);
            toast.success('Card added');
        } catch {
            toast.error('Failed to add card');
        }
    };

    if (loading) {
        return (
            <div className="page-enter stitch-screen" style={{ padding: 32 }}>
                <SkeletonLine width="40%" height={28} style={{ marginBottom: 24 }} />
                <div className="skeleton" style={{ width: '100%', height: 300, borderRadius: 16 }} />
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="page-enter" style={{ textAlign: 'center', padding: 64 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--border-subtle)', marginBottom: 12, display: 'block' }}>layers</span>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Deck not found</p>
                <button className="btn btn-primary" onClick={() => navigate('/decks')}>Back to Decks</button>
            </div>
        );
    }

    const cards = deck.cards || [];
    const progress = cards.length > 0 ? ((currentCard + 1) / cards.length) * 100 : 0;

    const goNext = () => {
        if (currentCard < cards.length - 1) {
            setFlipped(false);
            setCurrentCard(currentCard + 1);
        }
    };

    const goPrev = () => {
        if (currentCard > 0) {
            setFlipped(false);
            setCurrentCard(currentCard - 1);
        }
    };

    return (
        <div className="page-enter stitch-screen">
            {/* ── Header ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 28, flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/decks')}
                        title="Back to My Decks"
                        style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#17171c' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                        {editingTitle ? (
                            <input
                                className="input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                                autoFocus
                                style={{ fontSize: 18, fontWeight: 700, width: 280, letterSpacing: '-0.02em' }}
                            />
                        ) : (
                            <h1
                                style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', cursor: 'pointer' }}
                                onClick={() => setEditingTitle(true)}
                                title="Click to edit title"
                            >
                                {deck.title}
                            </h1>
                        )}
                        <span className="badge" style={{ background: 'rgba(75,43,238,0.15)', color: '#c6c0ff', border: '1px solid rgba(75,43,238,0.25)' }}>
                            {cards.length} cards
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleExport}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
                        <span style={{ display: 'none' }} className="btn-text-sm">Export</span>
                        <span>Export</span>
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/quiz?deckId=${id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                        Start Quiz
                    </button>
                </div>
            </div>

            {/* ── Main Grid: Flashcard + Sidebar ── */}
            <div className="deck-study-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

                {/* Left: Flashcard area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cards.length > 0 ? (
                        <>
                            {/* Main flashcard */}
                            <div
                                className="stitch-flashcard-container"
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => setFlipped(f => !f)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f); } }}
                                aria-label={flipped ? 'Answer (click to flip to question)' : 'Question (click to flip to answer)'}
                            >
                                {/* Card Header */}
                                <div className="stitch-flashcard-header">
                                    <span className="stitch-question-badge">
                                        {flipped ? 'Answer' : `Question ${currentCard + 1}`}
                                    </span>
                                    <button
                                        className="stitch-flip-btn"
                                        onClick={(e) => { e.stopPropagation(); setFlipped(f => !f); }}
                                        title="Flip card"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flip</span>
                                        Flip Card
                                    </button>
                                </div>

                                {/* Card Content */}
                                <div className="stitch-flashcard-question">
                                    <p style={{ color: flipped ? '#a5b4fc' : '#ffffff' }}>
                                        {flipped
                                            ? (cards[currentCard]?.answer || '')
                                            : (cards[currentCard]?.question || '')}
                                    </p>
                                    {!flipped && (
                                        <div className="stitch-flip-hint">
                                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }}>touch_app</span>
                                            Click card or press Space to reveal answer
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="stitch-flashcard-footer">
                                    <span className="stitch-category-chip">
                                        {deck.topic || 'General'}
                                    </span>
                                </div>
                            </div>

                            {/* Keyboard hint */}
                            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                                Space to flip&nbsp;·&nbsp;← Prev&nbsp;·&nbsp;→ Next
                            </p>

                            {/* Progress + Navigation */}
                            <div className="stitch-nav-controls">
                                {/* Progress bar */}
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                                </div>

                                {/* Nav row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                                    <button
                                        onClick={goPrev}
                                        disabled={currentCard === 0}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '6px 12px', borderRadius: 8, border: '1px solid transparent',
                                            background: 'none', cursor: currentCard === 0 ? 'not-allowed' : 'pointer',
                                            color: currentCard === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                                            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                                            transition: 'all 150ms ease',
                                        }}
                                        onMouseEnter={(e) => { if (currentCard > 0) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = '#27272a'; } }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                                        Prev
                                    </button>

                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.02em', fontFamily: 'var(--font-mono)' }}>
                                        {currentCard + 1} / {cards.length}
                                    </span>

                                    <button
                                        onClick={goNext}
                                        disabled={currentCard === cards.length - 1}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '6px 12px', borderRadius: 8,
                                            background: currentCard === cards.length - 1 ? 'transparent' : 'var(--accent)',
                                            border: 'none',
                                            cursor: currentCard === cards.length - 1 ? 'not-allowed' : 'pointer',
                                            color: currentCard === cards.length - 1 ? 'var(--text-muted)' : '#fff',
                                            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                                            transition: 'all 150ms ease',
                                            opacity: currentCard === cards.length - 1 ? 0.5 : 1,
                                        }}
                                    >
                                        Next
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="stitch-flashcard-container" style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--border-subtle)', marginBottom: 12 }}>layers</span>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                This deck has no cards yet.<br />
                                <button onClick={handleAddCard} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                                    Add First Card
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Cards Sidebar */}
                <aside className="stitch-deck-sidebar">
                    {/* Sidebar Header */}
                    <div className="stitch-deck-sidebar-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Cards</h2>
                            <span style={{
                                padding: '1px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                                background: '#222227', color: '#cbd5e1', border: '1px solid #2e2e36',
                            }}>
                                {cards.length}
                            </span>
                        </div>
                        <button
                            onClick={handleAddCard}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 8,
                                background: 'rgba(75,43,238,0.12)', border: '1px solid rgba(75,43,238,0.25)',
                                color: '#c6c0ff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', transition: 'all 150ms ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(75,43,238,0.22)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(75,43,238,0.12)'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 14, fontWeight: 700 }}>add</span>
                            Add card
                        </button>
                    </div>

                    {/* Card List */}
                    <div className="stitch-deck-sidebar-list hide-scrollbar">
                        {cards.map((card, i) => (
                            <div
                                key={i}
                                className={`stitch-card-item ${i === currentCard ? 'active' : ''}`}
                                onClick={() => { setFlipped(false); setCurrentCard(i); }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && (setFlipped(false), setCurrentCard(i))}
                                aria-label={`Card ${i + 1}: ${card.question}`}
                                aria-current={i === currentCard ? 'true' : undefined}
                            >
                                <span className="stitch-card-num">{i + 1}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="stitch-card-item-text">{card.question}</p>
                                    {i === currentCard && (
                                        <span style={{ fontSize: 10, color: 'rgba(198,192,255,0.7)', marginTop: 3, display: 'block' }}>
                                            Current active card
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
