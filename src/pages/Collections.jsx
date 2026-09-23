import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { getCached, setCached, invalidateCache } from '../utils/cache';

export default function Collections() {
    const [collections, setCollections] = useState(() => getCached('collections') || []);
    const [decks, setDecks] = useState(() => getCached('decks') || []);
    const [loading, setLoading] = useState(() => !getCached('collections') || !getCached('decks'));
    const [openCollectionId, setOpenCollectionId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [showAddDeckFor, setShowAddDeckFor] = useState(null);
    const [searchDeck, setSearchDeck] = useState('');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        let mounted = true;
        Promise.allSettled([
            api.get('/api/collections'),
            api.get('/api/decks'),
        ]).then(([colRes, deckRes]) => {
            if (!mounted) return;
            if (colRes.status === 'fulfilled') {
                const colData = Array.isArray(colRes.value.data) ? colRes.value.data : [];
                setCollections(colData);
                setCached('collections', colData, 60000);
            }
            if (deckRes.status === 'fulfilled') {
                const decksData = Array.isArray(deckRes.value.data) ? deckRes.value.data : [];
                setDecks(decksData);
                setCached('decks', decksData, 60000);
            }
            setLoading(false);
        });

        return () => { mounted = false; };
    }, []);

    const createCollection = async () => {
        if (!newName.trim()) return;
        try {
            const res = await api.post('/api/collections', { name: newName, deckIds: [] });
            const newCol = res.data;
            setCollections(prev => [...prev, newCol]);
            invalidateCache('collections');
            setNewName('');
            setShowCreate(false);
            setOpenCollectionId(newCol._id);
            toast.success('Collection created');
        } catch {
            toast.error('Failed to create collection');
        }
    };

    const updateCollection = async (col) => {
        try {
            const res = await api.put(`/api/collections/${col._id}`, col);
            setCollections(prev => prev.map(c => c._id === col._id ? res.data : c));
            invalidateCache('collections');
        } catch {
            toast.error('Failed to update');
        }
    };

    const deleteCollection = async () => {
        try {
            await api.delete(`/api/collections/${deleteId}`);
            setCollections(prev => prev.filter(c => c._id !== deleteId));
            invalidateCache('collections');
            if (openCollectionId === deleteId) setOpenCollectionId(null);
            toast.success('Collection deleted');
        } catch {
            toast.error('Failed to delete');
        }
        setDeleteId(null);
    };

    const addDeckToCollection = (collection, deckId) => {
        const updated = { ...collection, deckIds: [...(collection.deckIds || []), deckId] };
        updateCollection(updated);
        setShowAddDeckFor(null);
        setSearchDeck('');
    };

    const removeDeckFromCollection = (collection, deckId) => {
        const updated = { ...collection, deckIds: (collection.deckIds || []).filter(id => id !== deckId) };
        updateCollection(updated);
    };

    const toggleCollection = (colId) => {
        setOpenCollectionId(prev => prev === colId ? null : colId);
        setShowAddDeckFor(null);
    };

    const filteredCollections = useMemo(() =>
        collections.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())),
        [collections, search]
    );

    const getAvailableDecks = (collection) =>
        decks.filter(d =>
            !collection.deckIds?.includes(d._id) &&
            d.title.toLowerCase().includes(searchDeck.toLowerCase())
        );

    const getDeckById = (id) => decks.find(d => d._id === id);

    return (
        <div className="page-enter stitch-screen">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Collections</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreate(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    New Collection
                </button>
            </div>

            {/* Search */}
            <div className="stitch-search-row">
                <span className="material-symbols-outlined">search</span>
                <input
                    className="input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search collections..."
                    aria-label="Search collections"
                />
            </div>

            {/* Collections Accordion */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 4 }} />
                    ))}
                </div>
            ) : filteredCollections.length > 0 ? (
                <div style={{
                    background: '#17171c',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 14,
                    overflow: 'hidden',
                }}>
                    {filteredCollections.map((col) => {
                        const isOpen = openCollectionId === col._id;
                        const collectionDecks = (col.deckIds || []).map(getDeckById).filter(Boolean);
                        const isAddingDeck = showAddDeckFor === col._id;
                        const availableDecks = getAvailableDecks(col);

                        return (
                            <div key={col._id} className="stitch-collection-item">
                                {/* Accordion Toggle */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button
                                        className={`stitch-collection-toggle ${isOpen ? 'open' : ''}`}
                                        onClick={() => toggleCollection(col._id)}
                                        aria-expanded={isOpen}
                                        style={{ flex: 1 }}
                                    >
                                        <div className="stitch-collection-toggle-left">
                                            <span className={`material-symbols-outlined folder-icon ${isOpen ? 'icon-filled' : ''}`}
                                                style={{ color: isOpen ? 'var(--accent)' : 'var(--text-muted)', fontSize: 22 }}>
                                                {isOpen ? 'folder_open' : 'folder'}
                                            </span>
                                            <div>
                                                <div className="stitch-collection-name">{col.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                                    {collectionDecks.length} {collectionDecks.length === 1 ? 'deck' : 'decks'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className="material-symbols-outlined stitch-collection-chevron" style={{ color: 'var(--text-muted)', fontSize: 18 }}>
                                                expand_more
                                            </span>
                                        </div>
                                    </button>
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteId(col._id); }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-muted)', padding: '8px 14px',
                                            transition: 'color 150ms ease',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                        title="Delete collection"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                                    </button>
                                </div>

                                {/* Expanded Content */}
                                {isOpen && (
                                    <div className="stitch-collection-content open">
                                        {/* Deck list */}
                                        {collectionDecks.length > 0 ? collectionDecks.map(deck => (
                                            <div key={deck._id} className="stitch-collection-deck-item"
                                                onClick={() => navigate(`/decks/${deck._id}`)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/decks/${deck._id}`)}
                                            >
                                                <div className="stitch-collection-deck-icon">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>layers</span>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {deck.title}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                        {deck.cards?.length || 0} cards
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-muted)' }}>chevron_right</span>
                                                <button
                                                    className="stitch-collection-deck-remove"
                                                    onClick={(e) => { e.stopPropagation(); removeDeckFromCollection(col, deck._id); }}
                                                    title="Remove from collection"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove_circle_outline</span>
                                                </button>
                                            </div>
                                        )) : (
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0 8px' }}>
                                                No decks in this collection yet.
                                            </p>
                                        )}

                                        {/* Add Deck */}
                                        {isAddingDeck ? (
                                            <div style={{
                                                background: '#18181d', border: '1px solid var(--border-subtle)',
                                                borderRadius: 10, padding: 12, marginTop: 4,
                                            }}>
                                                <div className="stitch-search-row" style={{ marginBottom: 10 }}>
                                                    <span className="material-symbols-outlined">search</span>
                                                    <input
                                                        className="input"
                                                        placeholder="Search decks..."
                                                        value={searchDeck}
                                                        onChange={(e) => setSearchDeck(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {availableDecks.length > 0 ? availableDecks.map(d => (
                                                        <button
                                                            key={d._id}
                                                            onClick={() => addDeckToCollection(col, d._id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10,
                                                                padding: '10px 12px', borderRadius: 8,
                                                                background: '#1e1e24', border: '1px solid var(--border-subtle)',
                                                                color: 'var(--text-primary)', cursor: 'pointer',
                                                                fontFamily: 'var(--font-sans)', textAlign: 'left',
                                                                transition: 'background 150ms ease',
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#25252c'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = '#1e1e24'}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>add</span>
                                                            <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{d.title}</span>
                                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.cards?.length || 0} cards</span>
                                                        </button>
                                                    )) : (
                                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8, textAlign: 'center' }}>
                                                            {searchDeck ? 'No matching decks' : 'No more decks available'}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => { setShowAddDeckFor(null); setSearchDeck(''); }}
                                                    style={{
                                                        width: '100%', marginTop: 8, padding: '7px', borderRadius: 8,
                                                        border: '1px solid var(--border-subtle)', background: 'transparent',
                                                        color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="stitch-add-deck-btn"
                                                onClick={(e) => { e.stopPropagation(); setShowAddDeckFor(col._id); setSearchDeck(''); }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                                                Add Deck
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', padding: '64px 24px',
                    background: '#17171c', border: '1px solid var(--border-subtle)', borderRadius: 14,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--border-subtle)', marginBottom: 16, display: 'block' }}>folder</span>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
                        {search ? `No collections matching "${search}"` : 'No collections yet. Create one to organize your decks.'}
                    </p>
                    {!search && (
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Collection</button>
                    )}
                </div>
            )}

            {/* Create Collection Modal */}
            <Modal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="New Collection"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={createCollection} disabled={!newName.trim()}>Create</button>
                    </>
                }
            >
                <input
                    className="input"
                    placeholder="Collection name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createCollection()}
                    autoFocus
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Delete Collection"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={deleteCollection}>Delete</button>
                    </>
                }
            >
                Are you sure? The decks inside will not be deleted — just removed from this collection.
            </Modal>
        </div>
    );
}
