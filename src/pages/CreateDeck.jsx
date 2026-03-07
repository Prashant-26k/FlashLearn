import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FlashCard from '../components/FlashCard';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

const TABS = ['Paste Text', 'Upload PDF', 'Upload Word', 'Topic Search'];

export default function CreateDeck() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const fileRef = useRef(null);

    const [deckName, setDeckName] = useState('');
    const [activeTab, setActiveTab] = useState(searchParams.get('topic') ? 3 : 0);
    const [pasteText, setPasteText] = useState('');
    const [topicInput, setTopicInput] = useState(searchParams.get('topic') || '');
    const [cards, setCards] = useState([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [fileName, setFileName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [deckId, setDeckId] = useState(null);

    // Preferences for Autosave
    const [autoSaveEnabled] = useState(() => {
        const saved = localStorage.getItem('flashlearn_prefs');
        if (saved) {
            return JSON.parse(saved).autoSave !== false;
        }
        return true;
    });

    // New card manual entry
    const [showAddCard, setShowAddCard] = useState(false);
    const [newQ, setNewQ] = useState('');
    const [newA, setNewA] = useState('');

    // Auto-generate if topic from URL
    useEffect(() => {
        const t = searchParams.get('topic');
        if (t && !cards.length && !generating) {
            handleGenerateFromTopic(t);
        }
    }, []);

    // Autosave effect (debounced 1.5 seconds)
    useEffect(() => {
        if (!autoSaveEnabled || !cards.length || generating) return;

        const saveTimer = setTimeout(async () => {
            const currentTitle = deckName.trim() || topicInput.trim() || 'Untitled Deck';
            try {
                if (deckId) {
                    await api.put(`/api/decks/${deckId}`, {
                        title: currentTitle,
                        topic: topicInput || 'General',
                        cards,
                    });
                } else {
                    const res = await api.post('/api/decks', {
                        title: currentTitle,
                        topic: topicInput || 'General',
                        cards,
                    });
                    setDeckId(res.data._id);
                }
            } catch {
                // Silent catch for auto-saving
            }
        }, 1500);

        return () => clearTimeout(saveTimer);
    }, [cards, deckName, topicInput, autoSaveEnabled, generating, deckId]);

    const handleGenerateFromText = async () => {
        if (!pasteText.trim()) return toast.error('Please paste some text');
        setGenerating(true);
        try {
            const res = await api.post('/api/generate/text', { text: pasteText });
            setCards(res.data.cards || []);
            setCurrentCard(0);
            toast.success(`Generated ${res.data.cards?.length || 0} cards`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate cards');
        }
        setGenerating(false);
    };

    const handleGenerateFromTopic = async (t) => {
        const topic = t || topicInput;
        if (!topic.trim()) return toast.error('Please enter a topic');
        setGenerating(true);
        try {
            const res = await api.post('/api/generate/topic', { topic });
            setCards(res.data.cards || []);
            setCurrentCard(0);
            if (!deckName) setDeckName(topic);
            toast.success(`Generated ${res.data.cards?.length || 0} cards`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate cards');
        }
        setGenerating(false);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return toast.error('Please select a file');
        const formData = new FormData();
        formData.append('file', selectedFile);
        setGenerating(true);
        try {
            const res = await api.post('/api/generate/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setCards(res.data.cards || []);
            setCurrentCard(0);
            toast.success(`Generated ${res.data.cards?.length || 0} cards`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate cards');
        }
        setGenerating(false);
    };

    const handleSave = async () => {
        const currentTitle = deckName.trim() || topicInput.trim();
        if (!currentTitle) return toast.error('Please enter a deck name');
        if (!cards.length) return toast.error('Please generate some cards first');
        try {
            if (deckId) {
                await api.put(`/api/decks/${deckId}`, {
                    title: currentTitle,
                    topic: topicInput || 'General',
                    cards,
                });
            } else {
                await api.post('/api/decks', {
                    title: currentTitle,
                    topic: topicInput || 'General',
                    cards,
                });
            }
            toast.success('Deck saved successfully!');
            navigate('/decks');
        } catch (err) {
            toast.error('Failed to save deck');
        }
    };

    const addManualCard = () => {
        if (!newQ.trim() || !newA.trim()) return;
        setCards([...cards, { question: newQ, answer: newA }]);
        setNewQ('');
        setNewA('');
        setShowAddCard(false);
    };

    const deleteCard = (idx) => {
        const newCards = cards.filter((_, i) => i !== idx);
        setCards(newCards);
        if (currentCard >= newCards.length) setCurrentCard(Math.max(0, newCards.length - 1));
    };

    const handleFileDrop = (e, accept) => {
        e.preventDefault();
        const file = e.dataTransfer?.files[0] || e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
        }
    };

    return (
        <div className="page-enter">
            {/* Topbar override */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24, gap: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ fontSize: 18 }}>←</button>
                    <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>New Deck</h1>
                </div>
                <button className="btn btn-primary" onClick={handleSave}>Save Deck</button>
            </div>

            {/* Two-panel layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, minHeight: 'calc(100vh - 180px)' }}>
                {/* LEFT - Input Panel */}
                <div>
                    <input
                        className="input"
                        placeholder="Deck name..."
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        style={{ marginBottom: 16 }}
                    />

                    <div className="tab-bar" style={{ marginBottom: 16 }}>
                        {TABS.map((tab, i) => (
                            <button
                                key={tab}
                                className={`tab-item ${activeTab === i ? 'active' : ''}`}
                                onClick={() => setActiveTab(i)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 0 && (
                        <div>
                            <textarea
                                className="textarea"
                                placeholder="Paste your study material here..."
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                            />
                            <button
                                className="btn btn-primary btn-full"
                                style={{ marginTop: 16 }}
                                onClick={handleGenerateFromText}
                                disabled={generating}
                            >
                                {generating ? 'Generating...' : 'Generate Cards'}
                            </button>
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div>
                            <div
                                className={`upload-zone`}
                                onClick={() => fileRef.current?.click()}
                                onDrop={(e) => { e.preventDefault(); handleFileDrop(e, '.pdf'); }}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileDrop(e)}
                                />
                                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📄</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    {fileName || 'Drag PDF here or click to browse'}
                                </p>
                            </div>
                            <button
                                className="btn btn-primary btn-full"
                                style={{ marginTop: 16 }}
                                onClick={handleFileUpload}
                                disabled={generating || !selectedFile}
                            >
                                {generating ? 'Generating...' : 'Generate Cards'}
                            </button>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div>
                            <div
                                className="upload-zone"
                                onClick={() => fileRef.current?.click()}
                                onDrop={(e) => { e.preventDefault(); handleFileDrop(e); }}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".docx"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileDrop(e)}
                                />
                                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📝</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    {fileName || 'Drag Word file here or click to browse'}
                                </p>
                            </div>
                            <button
                                className="btn btn-primary btn-full"
                                style={{ marginTop: 16 }}
                                onClick={handleFileUpload}
                                disabled={generating || !selectedFile}
                            >
                                {generating ? 'Generating...' : 'Generate Cards'}
                            </button>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div>
                            <input
                                className="input"
                                placeholder="Enter any topic — Gemini will generate flashcards"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromTopic()}
                                style={{ fontSize: 'var(--text-md)' }}
                            />
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 8, marginBottom: 16 }}>
                                Enter any topic — Gemini will generate flashcards
                            </p>
                            <button
                                className="btn btn-primary btn-full"
                                onClick={() => handleGenerateFromTopic()}
                                disabled={generating}
                            >
                                {generating ? 'Generating...' : 'Generate Cards'}
                            </button>
                        </div>
                    )}

                    {/* Loading skeleton overlay */}
                    {generating && (
                        <div style={{ marginTop: 16 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 'var(--radius-sm)' }} />
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT - Preview Panel */}
                <div style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 20,
                        alignItems: 'center',
                    }}>
                        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Preview</h3>
                        <span className="badge badge-violet">{cards.length} cards</span>
                    </div>

                    {cards.length > 0 ? (
                        <>
                            <FlashCard
                                key={currentCard}
                                question={cards[currentCard]?.question}
                                answer={cards[currentCard]?.answer}
                                width={Math.min(480, 520)}
                                height={280}
                            />
                            <p style={{
                                color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 12,
                            }}>
                                Click to flip
                            </p>

                            {/* Nav buttons */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setCurrentCard(Math.max(0, currentCard - 1))}
                                    disabled={currentCard === 0}
                                >
                                    ← Prev
                                </button>
                                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', alignSelf: 'center' }}>
                                    {currentCard + 1} / {cards.length}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setCurrentCard(Math.min(cards.length - 1, currentCard + 1))}
                                    disabled={currentCard === cards.length - 1}
                                >
                                    Next →
                                </button>
                            </div>

                            {/* Card thumbnail list */}
                            <div style={{
                                width: '100%', marginTop: 20, maxHeight: 240, overflowY: 'auto',
                                display: 'flex', flexDirection: 'column', gap: 4,
                            }}>
                                {cards.map((card, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentCard(i)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            background: i === currentCard ? 'var(--bg-elevated)' : 'transparent',
                                            borderLeft: i === currentCard ? '2px solid var(--accent)' : '2px solid transparent',
                                            transition: 'all 150ms ease',
                                        }}
                                    >
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <span style={{
                                                fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: 8,
                                            }}>
                                                {i + 1}.
                                            </span>
                                            <span style={{
                                                fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>
                                                {card.question}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => { e.stopPropagation(); deleteCard(i); }}
                                            style={{ opacity: 0.5, padding: '0 4px' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: 12, opacity: 0.5,
                        }}>
                            <div style={{ fontSize: 48 }}>▤</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                Generate cards to see preview
                            </p>
                        </div>
                    )}

                    {/* Add card manually */}
                    {showAddCard ? (
                        <div style={{ width: '100%', marginTop: 16, padding: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                            <input className="input" placeholder="Question" value={newQ} onChange={(e) => setNewQ(e.target.value)} style={{ marginBottom: 8 }} />
                            <input className="input" placeholder="Answer" value={newA} onChange={(e) => setNewA(e.target.value)} style={{ marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={addManualCard}>Add</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCard(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn btn-ghost btn-full"
                            style={{ marginTop: 12 }}
                            onClick={() => setShowAddCard(true)}
                        >
                            + Add Card Manually
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
