import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { getCached, setCached, invalidateCache } from '../utils/cache';

export default function Collections() {
    const [collections, setCollections] = useState([]);
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingName, setEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [showAddDeck, setShowAddDeck] = useState(false);
    const [searchDeck, setSearchDeck] = useState('');
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const cachedCol = getCached('collections');
        const cachedDecks = getCached('decks');

        if (cachedCol && cachedDecks) {
            setCollections(cachedCol);
            setDecks(cachedDecks);
            setLoading(false);
            return;
        }

        try {
            const [colRes, deckRes] = await Promise.all([
                api.get('/api/collections'),
                api.get('/api/decks'),
            ]);
            setCollections(colRes.data || []);
            setDecks(deckRes.data || []);
            setCached('collections', colRes.data || [], 60000);
            setCached('decks', deckRes.data || [], 60000);
        } catch { /* backend not running */ }
        setLoading(false);
    };

    const createCollection = async () => {
        if (!newName.trim()) return;
        try {
            const res = await api.post('/api/collections', { name: newName, deckIds: [] });
            setCollections([...collections, res.data]);
            invalidateCache('collections');
            invalidateCache('dashboard_collections');
            setNewName('');
            setShowCreate(false);
            toast.success('Collection created');
        } catch {
            toast.error('Failed to create collection');
        }
    };

    const updateCollection = async (col) => {
        try {
            const res = await api.put(`/api/collections/${col._id}`, col);
            setCollections(collections.map(c => c._id === col._id ? res.data : c));
            invalidateCache('collections');
            invalidateCache('dashboard_collections');
            if (selected?._id === col._id) setSelected(res.data);
        } catch {
            toast.error('Failed to update');
        }
    };

    const deleteCollection = async () => {
        try {
            await api.delete(`/api/collections/${deleteId}`);
            setCollections(collections.filter(c => c._id !== deleteId));
            invalidateCache('collections');
            invalidateCache('dashboard_collections');
            if (selected?._id === deleteId) setSelected(null);
            toast.success('Collection deleted');
        } catch {
            toast.error('Failed to delete');
        }
        setDeleteId(null);
    };

    const addDeckToCollection = (deckId) => {
        if (!selected) return;
        const updated = { ...selected, deckIds: [...(selected.deckIds || []), deckId] };
        updateCollection(updated);
        setShowAddDeck(false);
    };

    const removeDeckFromCollection = (deckId) => {
        if (!selected) return;
        const updated = { ...selected, deckIds: (selected.deckIds || []).filter(id => id !== deckId) };
        updateCollection(updated);
    };

    const handleNameSave = () => {
        setEditingName(false);
        if (editName && editName !== selected.name) {
            updateCollection({ ...selected, name: editName });
        }
    };

    const colors = ['#5E6AD2', '#4CAF82', '#E8A320', '#E05252', '#7B84E0'];

    const selectedDeckIdSet = useMemo(() =>
        new Set(selected?.deckIds || []),
        [selected?.deckIds]
    );

    const availableDecks = useMemo(() =>
        decks.filter(d =>
            !selectedDeckIdSet.has(d._id) &&
            d.title.toLowerCase().includes(searchDeck.toLowerCase())
        ),
        [decks, selectedDeckIdSet, searchDeck]
    );

    if (selected) {
        const collectionDecks = decks.filter(d => selected.deckIds?.includes(d._id));

        return (
            <div className="page-enter">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ fontSize: 18 }}>←</button>
                    {editingName ? (
                        <input
                            className="input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            autoFocus
                            style={{ fontSize: 'var(--text-xl)', fontWeight: 700, width: 300 }}
                        />
                    ) : (
                        <h1
                            style={{ fontSize: 'var(--text-xl)', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => { setEditName(selected.name); setEditingName(true); }}
                        >
                            {selected.name}
                        </h1>
                    )}
                    <span className="badge">{collectionDecks.length} decks</span>
                </div>

                {/* Deck list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {collectionDecks.length > 0 ? collectionDecks.map(deck => (
                        <div key={deck._id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: 'var(--text-muted)', cursor: 'grab' }}>⠿</span>
                                <span
                                    style={{ fontWeight: 500, cursor: 'pointer' }}
                                    onClick={() => navigate(`/decks/${deck._id}`)}
                                >
                                    {deck.title}
                                </span>
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                    {deck.cards?.length || 0} cards
                                </span>
                            </div>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => removeDeckFromCollection(deck._id)}
                                style={{ fontSize: 16 }}
                            >
                                ×
                            </button>
                        </div>
                    )) : (
                        <p style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
                            No decks in this collection
                        </p>
                    )}
                </div>

                {/* Add deck */}
                {showAddDeck ? (
                    <div style={{
                        padding: 16, background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                    }}>
                        <input
                            className="input"
                            placeholder="Search decks..."
                            value={searchDeck}
                            onChange={(e) => setSearchDeck(e.target.value)}
                            style={{ marginBottom: 8 }}
                        />
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {availableDecks.map(d => (
                                <button
                                    key={d._id}
                                    className="dropdown-item"
                                    onClick={() => addDeckToCollection(d._id)}
                                >
                                    {d.title} <span style={{ color: 'var(--text-muted)' }}>({d.cards?.length || 0} cards)</span>
                                </button>
                            ))}
                            {availableDecks.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', padding: 8, fontSize: 'var(--text-sm)' }}>
                                    No more decks available
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <button className="btn btn-secondary" onClick={() => setShowAddDeck(true)}>
                        + Add Deck
                    </button>
                )}


            </div>
        );
    }

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Collections</h1>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Collection</button>
            </div>

            {loading ? <SkeletonGrid count={6} /> : collections.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {collections.map((col, idx) => (
                        <div
                            key={col._id}
                            className="deck-card"
                            style={{ borderLeft: `3px solid ${colors[idx % colors.length]}`, position: 'relative' }}
                            onClick={() => setSelected(col)}
                        >
                            <div style={{ paddingRight: 32 }}>
                                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 4 }}>{col.name}</h3>
                                <span className="badge">{col.deckIds?.length || 0} decks</span>
                            </div>
                            <button
                                className="btn btn-ghost"
                                onClick={(e) => { e.stopPropagation(); setDeleteId(col._id); }}
                                style={{ position: 'absolute', top: 12, right: 12, padding: 8, color: 'var(--text-muted)' }}
                                title="Delete Collection"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center', padding: '64px 0',
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◫</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No collections yet</p>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Collection</button>
                </div>
            )}

            {/* Create modal */}
            <Modal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="New Collection"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={createCollection}>Create</button>
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

            {/* Delete confirmation */}
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
                Are you sure? This will not delete the decks inside.
            </Modal>
        </div>
    );
}
