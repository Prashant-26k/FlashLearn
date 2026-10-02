import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getCached } from '../utils/cache';
import { useToast } from '../context/useToast';
import { getDeckReadPercentage } from '../utils/deckProgress';
import { getDeckStyle } from '../utils/deckStyle';

export default function Favorites() {
    const [favorites, setFavorites] = useState(() => {
        const cached = getCached('/api/decks/menu');
        if (!cached?.favorites) return [];
        return cached.favorites.map((deck) => ({
            _id: deck._id,
            title: deck.title,
            topic: deck.topic || 'General',
            cards: deck.cards || [],
            cardCount: Array.isArray(deck.cards) ? deck.cards.length : (deck.cardCount || 0),
            mastery: getDeckReadPercentage(deck),
            icon: 'layers',
        }));
    });
    const [loading, setLoading] = useState(() => !getCached('/api/decks/menu'));
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        let mounted = true;
        api.getCached('/api/decks/menu')
            .then(({ data }) => {
                if (!mounted) return;
                setFavorites((data?.favorites || []).map((deck) => ({
                    _id: deck._id,
                    title: deck.title,
                    topic: deck.topic || 'General',
                    cards: deck.cards || [],
                    cardCount: Array.isArray(deck.cards) ? deck.cards.length : (deck.cardCount || 0),
                    mastery: getDeckReadPercentage(deck),
                    icon: 'layers',
                })));
            })
            .catch(() => { if (mounted) setFavorites([]); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const toggleFavorite = async (deckId) => {
        try {
            await api.put(`/api/decks/${deckId}/favorite`, { favorite: false });
            setFavorites((prev) => prev.filter((d) => d._id !== deckId));
            toast.success('Removed from favourites');
        } catch {
            toast.error('Failed to update favourite');
        }
    };

    const filtered = favorites.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.topic && d.topic.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-symbols-outlined" style={{ color: '#f5c542', fontSize: 28 }}>star</span>
                        Favourites
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                        Your starred decks and prioritized study sets ({filtered.length} total)
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Filter favourite decks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input"
                            style={{ paddingLeft: 38, width: 240, height: 38, fontSize: 13 }}
                        />
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/decks')}
                    >
                        Browse All Decks
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading favourites...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 20px', border: '1px dashed var(--border-subtle)', borderRadius: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--border-subtle)', marginBottom: 12, display: 'block' }}>
                        star_outline
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                        {search ? 'No matching favourites' : 'No favourite decks yet'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                        Star decks while browsing or studying to have quick access to them here.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/decks')}>
                        Explore Decks
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {filtered.map((deck, idx) => {
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

                                        {/* Favorite star button */}
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(deck._id);
                                            }}
                                            aria-label={`Remove ${deck.title} from favorites`}
                                            style={{ color: '#f5c542', padding: '2px 4px' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>star</span>
                                        </button>
                                    </div>

                                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>{deck.title}</h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deck.cardCount} Cards</p>
                                </div>

                                {/* Mastery Bar */}
                                <div className="stitch-deck-grid-card-footer">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                        <span>Mastery</span>
                                        <span>{deck.mastery}%</span>
                                    </div>
                                    <div className="stitch-mastery-bar">
                                        <div className="stitch-mastery-fill" style={{ width: `${deck.mastery}%`, background: style.color }} />
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
