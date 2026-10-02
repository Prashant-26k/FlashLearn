import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../utils/api';
import { getCached } from '../utils/cache';
import { getDeckReadPercentage } from '../utils/deckProgress';
import { getDeckStyle } from '../utils/deckStyle';

function EmptyState({ icon, title, hint, actionLabel, onAction }) {
    return (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border-subtle)', borderRadius: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--border-subtle)', marginBottom: 8, display: 'block' }}>{icon}</span>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: actionLabel ? 16 : 0 }}>{hint}</p>
            {actionLabel && <button className="btn btn-primary btn-sm" onClick={onAction}>{actionLabel}</button>}
        </div>
    );
}

export default function Profile() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [todayHistory, setTodayHistory] = useState(() => {
        const cached = getCached('/api/decks');
        if (!Array.isArray(cached)) return [];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return cached
            .filter((d) => new Date(d.createdAt) >= startOfToday)
            .map((d) => ({
                id: d._id,
                type: 'deck_created',
                title: d.title,
                topic: d.topic || 'General',
                cards: d.cards || [],
                cardCount: Array.isArray(d.cards) ? d.cards.length : (d.cardCount || 0),
                mastery: getDeckReadPercentage(d),
                timeAgo: 'Created today',
            }));
    });
    const [favoriteDecks, setFavoriteDecks] = useState(() => {
        const cached = getCached('/api/decks/menu');
        if (!cached?.favorites) return [];
        return cached.favorites.map((d) => ({
            _id: d._id,
            title: d.title,
            topic: d.topic || 'General',
            cards: d.cards || [],
            cardCount: Array.isArray(d.cards) ? d.cards.length : (d.cardCount || 0),
            mastery: getDeckReadPercentage(d),
        }));
    });
    const [loading, setLoading] = useState(() => !getCached('/api/decks') && !getCached('/api/decks/menu'));

    useEffect(() => {
        let mounted = true;
        Promise.allSettled([api.getCached('/api/decks'), api.getCached('/api/decks/menu')])
            .then(([decksRes, menuRes]) => {
                if (!mounted) return;

                if (decksRes.status === 'fulfilled' && Array.isArray(decksRes.value.data)) {
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    setTodayHistory(
                        decksRes.value.data
                            .filter((d) => new Date(d.createdAt) >= startOfToday)
                            .map((d) => ({
                                id: d._id,
                                type: 'deck_created',
                                title: d.title,
                                topic: d.topic || 'General',
                                cards: d.cards || [],
                                cardCount: Array.isArray(d.cards) ? d.cards.length : (d.cardCount || 0),
                                mastery: getDeckReadPercentage(d),
                                timeAgo: 'Created today',
                            }))
                    );
                }

                if (menuRes.status === 'fulfilled') {
                    setFavoriteDecks((menuRes.value.data?.favorites || []).map((d) => ({
                        _id: d._id,
                        title: d.title,
                        topic: d.topic || 'General',
                        cards: d.cards || [],
                        cardCount: Array.isArray(d.cards) ? d.cards.length : (d.cardCount || 0),
                        mastery: getDeckReadPercentage(d),
                    })));
                }
                setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const handleSwitchAccount = () => {
        login();
    };

    return (
        <div className="page-enter profile-channel-container">
            {/* Profile Header */}
            <header className="profile-header-section">
                {/* Large Circular Profile Picture */}
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.displayName || 'Profile'}
                        className="profile-avatar-large"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="profile-avatar-placeholder">
                        {user?.displayName?.[0] || 'U'}
                    </div>
                )}

                {/* Profile Identity & Action Buttons */}
                <div className="profile-details">
                    <h1 className="profile-name">{user?.displayName || 'Alex Mercer'}</h1>

                    <div className="profile-actions-row">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleSwitchAccount}
                            title="Switch Account"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>switch_account</span>
                            Switch account
                        </button>

                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/settings')}
                            title="Settings"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>settings</span>
                            Settings
                        </button>
                    </div>
                </div>
            </header>

            {/* Today's History Section */}
            <section id="history" style={{ marginBottom: 40 }}>
                <div className="channel-section-header">
                    <h2 className="channel-section-title">
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 22 }}>history</span>
                        History (Today Only)
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Activity recorded for {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate('/history')}
                            style={{ fontSize: 13, color: 'var(--accent)', padding: 0 }}
                        >
                            View all history →
                        </button>
                    </div>
                </div>

                {loading ? null : todayHistory.length === 0 ? (
                    <EmptyState
                        icon="history_toggle_off"
                        title="No activity today"
                        hint="Decks you create today will appear here."
                        actionLabel="Create Deck"
                        onAction={() => navigate('/create')}
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                        {todayHistory.map((item, idx) => {
                            const style = getDeckStyle(item, idx);
                            const accuracyVal = item.mastery || 0;
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
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                background: item.type === 'deck_created' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                color: item.type === 'deck_created' ? '#818cf8' : '#34d399',
                                            }}>
                                                {item.type === 'deck_created' ? 'Deck' : 'Quiz'}
                                            </span>
                                        </div>

                                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>{item.title}</h2>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                            {item.cardCount} Cards • {item.timeAgo}
                                        </p>
                                    </div>

                                    <div className="stitch-deck-grid-card-footer">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                            <span>Mastery</span>
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
            </section>

            {/* Favourite Decks Section */}
            <section id="favorites">
                <div className="channel-section-header">
                    <h2 className="channel-section-title">
                        <span className="material-symbols-outlined" style={{ color: '#f5c542', fontSize: 22 }}>star</span>
                        Favourite Decks
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                            ({favoriteDecks.length})
                        </span>
                    </h2>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/favorites')}
                        style={{ fontSize: 13, color: 'var(--accent)' }}
                    >
                        View all favourites →
                    </button>
                </div>

                {loading ? null : favoriteDecks.length === 0 ? (
                    <EmptyState
                        icon="star_outline"
                        title="No favourite decks yet"
                        hint="Star a deck in My Decks to pin it here."
                        actionLabel="Browse Decks"
                        onAction={() => navigate('/decks')}
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                        {favoriteDecks.map((deck, idx) => {
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
                                            <div
                                                className="stitch-deck-icon-wrap"
                                                style={{ background: style.bg, color: style.color }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{style.icon}</span>
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label="Starred favorite"
                                                style={{ color: '#f5c542', padding: '2px 4px' }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>star</span>
                                            </button>
                                        </div>

                                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.02em' }}>{deck.title}</h2>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deck.cardCount} Cards</p>
                                    </div>

                                    <div className="stitch-deck-grid-card-footer">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                                            <span>Mastery</span>
                                            <span>{deck.mastery || 0}%</span>
                                        </div>
                                        <div className="stitch-mastery-bar">
                                            <div className="stitch-mastery-fill" style={{ width: `${deck.mastery || 0}%`, background: style.color }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
