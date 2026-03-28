import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SkeletonCard } from '../components/Skeleton';
import api from '../utils/api';
import { getCached, setCached } from '../utils/cache';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
    const [topic, setTopic] = useState('');
    const [recentDecks, setRecentDecks] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const cachedDecks = getCached('dashboard_decks');
        const cachedCollections = getCached('dashboard_collections');

        if (cachedDecks && cachedCollections) {
            setRecentDecks(cachedDecks);
            setCollections(cachedCollections);
            setLoading(false);
            return;
        }

        try {
            const [decksRes, collectionsRes] = await Promise.all([
                api.get('/api/decks?limit=8&sort=-createdAt'),
                api.get('/api/collections?limit=6'),
            ]);
            setRecentDecks(decksRes.data || []);
            setCollections(collectionsRes.data || []);
            setCached('dashboard_decks', decksRes.data || [], 30000);
            setCached('dashboard_collections', collectionsRes.data || [], 30000);
        } catch {
            // Backend might not be running yet
        }
        setLoading(false);
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        navigate(`/create?topic=${encodeURIComponent(topic.trim())}`);
    };

    return (
        <div className="page-enter">
            {/* Quick Generate Hero */}
            <section style={{ textAlign: 'center', padding: '48px 0 64px' }}>
                <h1 style={{
                    fontSize: 'var(--text-2xl)', fontWeight: 700,
                    letterSpacing: '-0.03em', marginBottom: 8,
                }}>
                    Generate flashcards from any topic
                </h1>
                <p style={{
                    color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 32,
                }}>
                    Powered by Gemini AI
                </p>

                <form onSubmit={handleGenerate} style={{
                    display: 'flex', justifyContent: 'center',
                }}>
                    <div className="hero-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Photosynthesis, Cold War, React Hooks..."
                        />
                        <button type="submit" className="btn btn-primary btn-pill btn-sm" style={{ height: 32 }}>
                            Generate
                        </button>
                    </div>
                </form>
            </section>

            {/* Recent Decks */}
            <section style={{ marginBottom: 48 }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
                }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Recent Decks</h2>
                    <Link to="/decks" style={{
                        color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
                        textDecoration: 'none', transition: 'color 150ms ease',
                    }}>
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} style={{ minWidth: 240 }} />)}
                    </div>
                ) : recentDecks.length > 0 ? (
                    <div className="hide-scrollbar" style={{
                        display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8,
                    }}>
                        {recentDecks.map(deck => (
                            <div
                                key={deck._id}
                                className="deck-card"
                                style={{ minWidth: 240, flex: '0 0 auto' }}
                                onClick={() => navigate(`/decks/${deck._id}`)}
                            >
                                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 8 }}>
                                    {deck.title}
                                </h3>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    {deck.cards?.length || 0} cards
                                </span>
                                {deck.topic && (
                                    <div style={{ marginTop: 8 }}>
                                        <span className="badge">{deck.topic}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '48px 0',
                        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>▤</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
                            No decks yet
                        </p>
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>
                            Create your first deck
                        </button>
                    </div>
                )}
            </section>

            {/* Collections */}
            <section>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
                }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Collections</h2>
                    <Link to="/collections" style={{
                        color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textDecoration: 'none',
                    }}>
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : collections.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {collections.map((col, idx) => {
                            const colors = ['#5E6AD2', '#4CAF82', '#E8A320', '#E05252', '#7B84E0'];
                            const accentColor = colors[idx % colors.length];
                            return (
                                <div
                                    key={col._id}
                                    className="deck-card"
                                    style={{ borderLeft: `3px solid ${accentColor}` }}
                                    onClick={() => navigate(`/collections`)}
                                >
                                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 4 }}>
                                        {col.name}
                                    </h3>
                                    <span className="badge" style={{ marginTop: 4 }}>
                                        {col.deckIds?.length || 0} decks
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '32px 0',
                        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            No collections yet. Create one from the Collections page.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
