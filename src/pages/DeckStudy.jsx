import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../context/useToast';
import api, { getApiErrorMessage } from '../utils/api';
import { getCached, invalidateCache } from '../utils/cache';
import { markCardRead } from '../utils/deckProgress';
import { getStudyQueue, reviewCard } from '../utils/spacedRepetition';
import { getFlipDuration } from '../utils/flipDuration';

export default function DeckStudy() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [deck, setDeck] = useState(() => getCached(`/api/decks/${id}`) || null);
    const [loading, setLoading] = useState(() => !getCached(`/api/decks/${id}`));
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(() => getCached(`/api/decks/${id}`)?.title || '');
    const [learningStyle, setLearningStyle] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('flashlearn_prefs') || '{}').learningStyle || 'sequential';
        } catch {
            return 'sequential';
        }
    });
    const [studyOrder, setStudyOrder] = useState([]);
    const [orderPosition, setOrderPosition] = useState(0);

    useEffect(() => {
        api.getCached('/api/preferences')
            .then(({ data }) => data?.learningStyle && setLearningStyle(data.learningStyle))
            .catch(() => {});
    }, []);

    const toggleFlip = useCallback(() => {
        if (!flipped && deck?.cards?.length) {
            markCardRead(id, currentCard, deck.cards.length);
        }
        setFlipped(prev => !prev);
    }, [currentCard, deck, flipped, id]);

    useEffect(() => {
        let mounted = true;
        api.getCached(`/api/decks/${id}`, {}, { freshMs: 60000, ttlMs: 300000 })
            .then(res => {
                if (!mounted) return;
                setDeck(res.data);
                setTitle(res.data.title);
                api.post(`/api/decks/${id}/visit`).catch(() => {});
            })
            .catch(() => {
                if (mounted) toast.error('Failed to load deck');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [id, toast]);

    useEffect(() => {
        if (!deck?.cards) return;
        const order = learningStyle === 'spaced'
            ? getStudyQueue(deck.cards)
            : deck.cards.map((_, index) => index);
        // Reset the session cursor when the loaded deck or persisted mode changes.
        setStudyOrder(order);
        setOrderPosition(0);
        setCurrentCard(order[0] || 0);
        setFlipped(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deck?._id, learningStyle]);

    const goToTimeoutRef = useRef(null);
    useEffect(() => {
        return () => {
            if (goToTimeoutRef.current) clearTimeout(goToTimeoutRef.current);
        };
    }, []);

    const goTo = useCallback((nextCardIndex, nextOrderPos = null) => {
        if (goToTimeoutRef.current) {
            clearTimeout(goToTimeoutRef.current);
            goToTimeoutRef.current = null;
        }

        setFlipped(false);

        const durationSec = parseFloat(getFlipDuration()) || 0.6;
        const delay = !flipped ? 0 : Math.round(durationSec * 1000);

        if (delay === 0) {
            if (nextOrderPos !== null) setOrderPosition(nextOrderPos);
            setCurrentCard(nextCardIndex);
        } else {
            goToTimeoutRef.current = setTimeout(() => {
                if (nextOrderPos !== null) setOrderPosition(nextOrderPos);
                setCurrentCard(nextCardIndex);
                goToTimeoutRef.current = null;
            }, delay);
        }
    }, [flipped]);

    const goNext = useCallback(() => {
        if (!deck?.cards?.length) return;
        if (learningStyle === 'spaced') {
            if (orderPosition < studyOrder.length - 1) {
                goTo(studyOrder[orderPosition + 1], orderPosition + 1);
            }
        } else if (currentCard < deck.cards.length - 1) {
            goTo(currentCard + 1);
        }
    }, [deck, learningStyle, orderPosition, studyOrder, currentCard, goTo]);

    const goPrev = useCallback(() => {
        if (!deck?.cards?.length) return;
        if (learningStyle === 'spaced') {
            if (orderPosition > 0) {
                goTo(studyOrder[orderPosition - 1], orderPosition - 1);
            }
        } else if (currentCard > 0) {
            goTo(currentCard - 1);
        }
    }, [deck, learningStyle, orderPosition, studyOrder, currentCard, goTo]);

    // Keyboard shortcuts: Space=flip, ←=prev, →=next
    const handleKeyDown = useCallback((e) => {
        if (!deck?.cards?.length) return;
        if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement?.tagName)) return;

        if (e.key === 'ArrowLeft') {
            goPrev();
        } else if (e.key === 'ArrowRight') {
            goNext();
        } else if (e.key === ' ') {
            e.preventDefault();
            toggleFlip();
        }
    }, [deck, toggleFlip, goPrev, goNext]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleTitleSave = async () => {
        setEditingTitle(false);
        if (title !== deck.title) {
            try {
                const res = await api.put(`/api/decks/${id}`, { title, version: deck.version });
                setDeck(res.data);
                invalidateCache(`deck_${id}`);
                invalidateCache('decks');
                invalidateCache('dashboard_decks');
                toast.success('Title updated');
            } catch (err) {
                if (err.response?.status === 409 || err.isConflict) {
                    toast.error('Your deck was changed in another tab. Reload the latest version or review your local changes.');
                    api.get(`/api/decks/${id}`).then(r => setDeck(r.data)).catch(() => {});
                } else {
                    toast.error(getApiErrorMessage(err, 'Failed to update title'));
                }
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
            const res = await api.put(`/api/decks/${id}`, {
                cards: [...deck.cards, { question: question.trim(), answer: answer.trim() }],
                version: deck.version,
            });
            setDeck(res.data);
            invalidateCache(`deck_${id}`);
            setCurrentCard((res.data.cards?.length || 1) - 1);
            toast.success('Card added');
        } catch (err) {
            if (err.response?.status === 409 || err.isConflict) {
                toast.error('Your deck was changed in another tab. Reload the latest version or review your local changes.');
                api.get(`/api/decks/${id}`).then(r => setDeck(r.data)).catch(() => {});
            } else {
                toast.error(getApiErrorMessage(err, 'Failed to add card'));
            }
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

    const handleReview = async (rating) => {
        const reviewed = reviewCard(cards[currentCard], rating);
        const nextCards = cards.map((card, index) => index === currentCard ? reviewed : card);
        try {
            const response = await api.put(`/api/decks/${id}`, {
                cards: nextCards,
                version: deck.version,
            });
            setDeck(response.data);
            invalidateCache(`deck_${id}`);
            toast.success(rating === 'again' ? 'Card scheduled to repeat' : 'Card scheduled');
            goNext();
        } catch (err) {
            if (err.response?.status === 409 || err.isConflict) {
                toast.error('Your deck was changed in another tab. Reload the latest version or review your local changes.');
                api.get(`/api/decks/${id}`).then(r => setDeck(r.data)).catch(() => {});
            } else {
                toast.error(getApiErrorMessage(err, 'Failed to save review'));
            }
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
                            {learningStyle === 'spaced' ? 'Spaced repetition' : `${cards.length} cards`}
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
                            {/* Main 3D flashcard */}
                            <div
                                className={`stitch-flashcard-container ${flipped ? 'is-flipped flipped' : ''}`}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={toggleFlip}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFlip();
                                    }
                                }}
                                aria-label={flipped ? 'Answer (click or press Space to flip to question)' : 'Question (click or press Space to flip to answer)'}
                                aria-pressed={flipped}
                            >
                                <div
                                    className={`stitch-flashcard-inner ${flipped ? 'is-flipped flipped' : ''}`}
                                    style={{ '--flip-duration': getFlipDuration() }}
                                >
                                    {/* Front Face: Question */}
                                    <div className="stitch-flashcard-face stitch-flashcard-front">
                                        <div className="stitch-flashcard-header">
                                            <span className="stitch-question-badge">
                                                Question {currentCard + 1}
                                            </span>
                                        </div>

                                        <div className="stitch-flashcard-question">
                                            <p style={{ color: '#ffffff' }}>
                                                {cards[currentCard]?.question || ''}
                                            </p>
                                            <div className="stitch-flip-hint">
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>touch_app</span>
                                                <span>flip</span>
                                            </div>
                                        </div>

                                        <div className="stitch-flashcard-footer">
                                            <span className="stitch-category-chip">
                                                {deck.topic || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Back Face: Answer */}
                                    <div className="stitch-flashcard-face stitch-flashcard-back">
                                        <div className="stitch-flashcard-header">
                                            <span className="stitch-question-badge" style={{ background: 'rgba(75, 43, 238, 0.25)', color: '#c6c0ff', borderColor: 'rgba(75, 43, 238, 0.4)' }}>
                                                Answer
                                            </span>
                                        </div>

                                        <div className="stitch-flashcard-question">
                                            <p style={{ color: '#c6c0ff' }}>
                                                {cards[currentCard]?.answer || ''}
                                            </p>
                                            <div className="stitch-flip-hint">
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>touch_app</span>
                                                <span>flip</span>
                                            </div>
                                        </div>

                                        <div className="stitch-flashcard-footer">
                                            <span className="stitch-category-chip">
                                                {deck.topic || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Keyboard hint */}
                            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                                Space to flip&nbsp;·&nbsp;← Prev&nbsp;·&nbsp;→ Next
                            </p>

                            {learningStyle === 'spaced' && flipped && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                    {['again', 'good', 'easy'].map((rating) => (
                                        <button key={rating} className="btn btn-secondary btn-sm" onClick={() => handleReview(rating)}>
                                            {rating[0].toUpperCase() + rating.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}

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
                                        disabled={learningStyle === 'spaced' ? orderPosition === 0 : currentCard === 0}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '6px 12px', borderRadius: 8, border: '1px solid transparent',
                                            background: 'none',                                             cursor: (learningStyle === 'spaced' ? orderPosition === 0 : currentCard === 0) ? 'not-allowed' : 'pointer',
                                            color: (learningStyle === 'spaced' ? orderPosition === 0 : currentCard === 0) ? 'var(--text-muted)' : 'var(--text-secondary)',
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
                                        disabled={learningStyle === 'spaced' ? orderPosition === studyOrder.length - 1 : currentCard === cards.length - 1}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '6px 12px', borderRadius: 8,
                                            background: (learningStyle === 'spaced' ? orderPosition === studyOrder.length - 1 : currentCard === cards.length - 1) ? 'transparent' : 'var(--accent)',
                                            border: 'none',
                                            cursor: (learningStyle === 'spaced' ? orderPosition === studyOrder.length - 1 : currentCard === cards.length - 1) ? 'not-allowed' : 'pointer',
                                            color: (learningStyle === 'spaced' ? orderPosition === studyOrder.length - 1 : currentCard === cards.length - 1) ? 'var(--text-muted)' : '#fff',
                                            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                                            transition: 'all 150ms ease',
                                            opacity: (learningStyle === 'spaced' ? orderPosition === studyOrder.length - 1 : currentCard === cards.length - 1) ? 0.5 : 1,
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
                        {cards.map((card, i) => {
                            const handleCardSelect = () => {
                                const pos = learningStyle === 'spaced' ? studyOrder.indexOf(i) : null;
                                goTo(i, pos !== -1 ? pos : null);
                            };
                            return (
                                <div
                                    key={i}
                                    className={`stitch-card-item ${i === currentCard ? 'active' : ''}`}
                                    onClick={handleCardSelect}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCardSelect()}
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
                            );
                        })}
                    </div>
                </aside>
            </div>
        </div>
    );
}
