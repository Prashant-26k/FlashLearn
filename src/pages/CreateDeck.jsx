import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FlashCard from '../components/FlashCard';
import { useToast } from '../context/useToast';
import api from '../utils/api';
import { invalidateCache } from '../utils/cache';
import GenerationLoader from '../components/GenerationLoader';

const DIRECTIVES = [
    { id: 'summary', label: 'Summary focus', instruction: 'Focus on summarizing key concepts and high-level ideas.' },
    { id: 'exam', label: 'High-yield exam', instruction: 'Focus on high-yield, exam-tested questions and testing understanding.' },
    { id: 'definitions', label: 'Definitions only', instruction: 'Focus strictly on vocabulary, terminology, and exact definitions.' },
];

const DECK_SIZES = [
    { count: 10, label: 'Quick Blitz', sub: '10 Cards' },
    { count: 20, label: 'Standard Study', sub: '20 Cards (Optimal)' },
    { count: 30, label: 'Deep Mastery', sub: '30 Cards' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const RECALL_STYLES = ['Active Recall', 'Multiple Choice'];

export default function CreateDeck() {
    const navigate = useNavigate();
    const toast = useToast();
    const fileRef = useRef(null);

    const [deckName, setDeckName] = useState('');
    const [activeTab, setActiveTab] = useState(0); // 0: Paste Text / Notes, 1: Upload PDF / Doc
    const [pasteText, setPasteText] = useState('');
    const [selectedDirective, setSelectedDirective] = useState(null);
    const [deckSize, setDeckSize] = useState(20);
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [recallStyle, setRecallStyle] = useState('Active Recall');
    const [memoryHooks, setMemoryHooks] = useState(false);

    const [cards, setCards] = useState([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [deckId, setDeckId] = useState(null);

    // Manual card entry
    const [showAddCard, setShowAddCard] = useState(false);
    const [newQ, setNewQ] = useState('');
    const [newA, setNewA] = useState('');

    // Word count calculation
    const wordCount = pasteText.trim() ? pasteText.trim().split(/\s+/).length : 0;
    const maxWords = 5000;

    // Autosave preference
    const [autoSaveEnabled] = useState(() => {
        const saved = localStorage.getItem('flashlearn_prefs');
        if (saved) {
            return JSON.parse(saved).autoSave !== false;
        }
        return true;
    });

    const handleKeyDown = useCallback((e) => {
        if (!cards?.length) return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === 'ArrowLeft') {
            setFlipped(false);
            setCurrentCard(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
            setFlipped(false);
            setCurrentCard(prev => Math.min(cards.length - 1, prev + 1));
        } else if (e.key === ' ') {
            e.preventDefault();
            setFlipped(prev => !prev);
        }
    }, [cards]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const titleRef = useRef({ deckName });
    useEffect(() => {
        titleRef.current = { deckName };
    }, [deckName]);

    // Autosave effect (debounced 1.5s)
    useEffect(() => {
        if (!autoSaveEnabled || !cards.length || generating) return;

        const saveTimer = setTimeout(async () => {
            const currentTitle = titleRef.current.deckName.trim() || 'Untitled Deck';
            try {
                if (deckId) {
                    await api.put(`/api/decks/${deckId}`, {
                        title: currentTitle,
                        topic: 'General',
                        cards,
                    });
                } else {
                    const res = await api.post('/api/decks', {
                        title: currentTitle,
                        topic: 'General',
                        cards,
                    });
                    setDeckId(res.data._id);
                }
                invalidateCache('decks');
                invalidateCache('dashboard_decks');
                if (deckId) invalidateCache(`deck_${deckId}`);
            } catch {
                // Silent catch for autosave
            }
        }, 1500);

        return () => clearTimeout(saveTimer);
    }, [cards, autoSaveEnabled, generating, deckId]);

    const buildDirectivePrefix = () => {
        const parts = [];
        parts.push(`Target deck size: exactly ${deckSize} flashcards.`);
        parts.push(`Target difficulty level: ${difficulty}.`);
        parts.push(`Recall style: ${recallStyle}.`);
        if (selectedDirective) {
            const directiveObj = DIRECTIVES.find(d => d.id === selectedDirective);
            if (directiveObj) parts.push(`Directive: ${directiveObj.instruction}`);
        }
        if (memoryHooks) {
            parts.push('Memory Hooks: Inject helpful mnemonic devices, analogies, or sensory cues in the answers.');
        }

        return `[Configuration Instructions:\n${parts.join('\n')}\n]\n\n`;
    };

    const handleGenerateFromText = async () => {
        if (!pasteText.trim()) return toast.error('Please paste study notes or text first');
        if (wordCount > maxWords) return toast.error(`Text exceeds maximum limit of ${maxWords} words`);

        setGenerating(true);
        try {
            const promptWithConfig = `${buildDirectivePrefix()}Source Material:\n${pasteText}`;
            const res = await api.post('/api/generate/text', { text: promptWithConfig });
            const generatedCards = res.data.cards || [];
            setCards(generatedCards);
            setCurrentCard(0);
            toast.success(`Generated ${generatedCards.length} flashcards!`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate cards');
        }
        setGenerating(false);
    };

    const handleFileUpload = async () => {
        const files = selectedFiles.length ? selectedFiles : [];
        if (!files.length) return toast.error('Please select at least one document');

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        if (files.length === 1) {
            formData.append('file', files[0]);
        }

        setGenerating(true);
        try {
            const res = await api.post('/api/generate/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const generatedCards = res.data.cards || [];
            setCards(generatedCards);
            setCurrentCard(0);
            toast.success(res.data.warnings?.length
                ? `Generated ${generatedCards.length} cards. Some sections could not be processed.`
                : `Generated ${generatedCards.length} flashcards!`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to generate cards');
        }
        setGenerating(false);
    };

    const handleSave = async () => {
        const currentTitle = deckName.trim();
        if (!currentTitle) return toast.error('Please enter a deck name');
        if (!cards.length) return toast.error('Please generate or create some cards first');
        try {
            if (deckId) {
                await api.put(`/api/decks/${deckId}`, {
                    title: currentTitle,
                    topic: 'General',
                    cards,
                });
            } else {
                await api.post('/api/decks', {
                    title: currentTitle,
                    topic: 'General',
                    cards,
                });
            }
            invalidateCache('decks');
            invalidateCache('dashboard_decks');
            if (deckId) invalidateCache(`deck_${deckId}`);
            toast.success('Deck saved successfully!');
            navigate('/decks');
        } catch {
            toast.error('Failed to save deck');
        }
    };

    const addManualCard = () => {
        if (!newQ.trim() || !newA.trim()) return;
        setCards([...cards, { question: newQ.trim(), answer: newA.trim() }]);
        setNewQ('');
        setNewA('');
        setShowAddCard(false);
    };

    const deleteCard = (idx) => {
        const newCards = cards.filter((_, i) => i !== idx);
        setCards(newCards);
        if (currentCard >= newCards.length) setCurrentCard(Math.max(0, newCards.length - 1));
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        const incomingFiles = Array.from(e.dataTransfer?.files || e.target.files || []);
        if (!incomingFiles.length) return;

        setSelectedFiles(incomingFiles);
        if (e.target && 'value' in e.target) {
            e.target.value = '';
        }
    };

    return (
        <div className="page-enter stitch-screen" style={{ maxWidth: 1120, margin: '0 auto' }}>
            {/* Topbar navigation & actions */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 24, gap: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(-1)}
                        style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#17171c' }}
                        title="Back"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                    </button>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Generate Deck with AI</h1>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Transform notes, documents, and concepts into smart flashcards</p>
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!cards.length}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                    Save Deck
                </button>
            </div>

            {/* Two-panel Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: 24, alignItems: 'start' }}>

                {/* LEFT - Source & AI Config Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Deck Title Input */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                            Deck Name
                        </label>
                        <input
                            className="input"
                            placeholder="e.g. Molecular Biology Exam, Spanish Verbs..."
                            value={deckName}
                            onChange={(e) => setDeckName(e.target.value)}
                        />
                    </div>

                    {/* Mode Switch Tabs */}
                    <div>
                        <div className="stitch-create-tabs">
                            <button
                                className={`stitch-create-tab ${activeTab === 0 ? 'active' : ''}`}
                                onClick={() => setActiveTab(0)}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_note</span>
                                Paste Text / Notes
                            </button>
                            <button
                                className={`stitch-create-tab ${activeTab === 1 ? 'active' : ''}`}
                                onClick={() => setActiveTab(1)}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                                Upload PDF / Doc
                            </button>
                        </div>

                        {/* TAB 0: Paste Text */}
                        {activeTab === 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Quick Directives */}
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Quick Directives
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {DIRECTIVES.map(d => (
                                            <button
                                                key={d.id}
                                                type="button"
                                                className={`stitch-directive-pill ${selectedDirective === d.id ? 'active' : ''}`}
                                                onClick={() => setSelectedDirective(selectedDirective === d.id ? null : d.id)}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Area & Word Counter */}
                                <div>
                                    <textarea
                                        className="textarea"
                                        placeholder="Paste study material, lecture notes, textbook chapters, or summary here..."
                                        value={pasteText}
                                        onChange={(e) => setPasteText(e.target.value)}
                                        style={{ minHeight: 180 }}
                                    />
                                    <div className="stitch-word-counter">
                                        <span style={{ color: wordCount > maxWords ? 'var(--danger)' : 'inherit' }}>
                                            {wordCount.toLocaleString()}
                                        </span> / {maxWords.toLocaleString()} words
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 1: File Upload */}
                        {activeTab === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div
                                    className="upload-zone"
                                    onClick={() => fileRef.current?.click()}
                                    onDrop={(e) => { e.preventDefault(); handleFileDrop(e); }}
                                    onDragOver={(e) => e.preventDefault()}
                                    style={{ background: '#17171c', borderColor: selectedFiles.length ? 'var(--accent)' : 'var(--border-subtle)' }}
                                >
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".pdf,.docx,.doc,.txt"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleFileDrop(e)}
                                    />
                                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--accent)', marginBottom: 8, display: 'block' }}>
                                        cloud_upload
                                    </span>
                                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                                        {selectedFiles.length
                                            ? selectedFiles.map(f => f.name).join(', ')
                                            : 'Click or drop PDF / Word documents here'}
                                    </p>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                        Supports .pdf, .docx, .doc, .txt files
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Configuration Parameters */}
                    <div style={{
                        background: '#17171c', border: '1px solid var(--border-subtle)',
                        borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 16,
                    }}>
                        {/* Deck Size Pills */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                                Deck Size
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {DECK_SIZES.map(s => (
                                    <button
                                        key={s.count}
                                        type="button"
                                        className={`stitch-size-pill ${deckSize === s.count ? 'active' : ''}`}
                                        onClick={() => setDeckSize(s.count)}
                                    >
                                        <span className="stitch-size-pill-num">{s.count}</span>
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Difficulty */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                                Target Difficulty
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {DIFFICULTIES.map(diff => (
                                    <button
                                        key={diff}
                                        type="button"
                                        className={`stitch-difficulty-btn ${difficulty === diff ? 'active' : ''}`}
                                        onClick={() => setDifficulty(diff)}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recall Style */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                                Recall Style
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {RECALL_STYLES.map(style => (
                                    <button
                                        key={style}
                                        type="button"
                                        className={`stitch-recall-btn ${recallStyle === style ? 'active' : ''}`}
                                        onClick={() => setRecallStyle(style)}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Memory Hooks Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>Memory Hooks</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inject mnemonic devices & sensory analogies</div>
                            </div>
                            <button
                                type="button"
                                className={`toggle-switch ${memoryHooks ? 'active' : ''}`}
                                onClick={() => setMemoryHooks(!memoryHooks)}
                                role="switch"
                                aria-checked={memoryHooks}
                                aria-label="Toggle memory hooks"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        className="btn btn-primary btn-full"
                        style={{ height: 48, fontSize: 15, fontWeight: 600, borderRadius: 12 }}
                        onClick={activeTab === 0 ? handleGenerateFromText : handleFileUpload}
                        disabled={generating || (activeTab === 0 ? !pasteText.trim() : !selectedFiles.length)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
                        {generating ? 'Synthesizing Flashcards...' : 'Generate Flashcards'}
                    </button>

                    {/* Loader */}
                    {generating && <GenerationLoader />}
                </div>

                {/* RIGHT - Interactive Preview Panel */}
                <div style={{
                    background: '#141417',
                    borderRadius: 16,
                    border: '1px solid #27272a',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 20,
                        alignItems: 'center',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>visibility</span>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Preview</h3>
                        </div>
                        <span className="badge" style={{ background: 'rgba(75,43,238,0.14)', color: '#c6c0ff' }}>
                            {cards.length} cards
                        </span>
                    </div>

                    {cards.length > 0 ? (
                        <>
                            <FlashCard
                                key={currentCard}
                                question={cards[currentCard]?.question}
                                answer={cards[currentCard]?.answer}
                                flipped={flipped}
                                onFlip={setFlipped}
                                width={Math.min(480, 520)}
                                height={260}
                            />
                            <p style={{
                                color: 'var(--text-muted)', fontSize: 11, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>touch_app</span>
                                Click card or press Space to flip &nbsp;·&nbsp; ← / → to navigate
                            </p>

                            {/* Nav buttons */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => { setFlipped(false); setCurrentCard(Math.max(0, currentCard - 1)); }}
                                    disabled={currentCard === 0}
                                >
                                    ← Prev
                                </button>
                                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                    {currentCard + 1} / {cards.length}
                                </span>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => { setFlipped(false); setCurrentCard(Math.min(cards.length - 1, currentCard + 1)); }}
                                    disabled={currentCard === cards.length - 1}
                                >
                                    Next →
                                </button>
                            </div>

                            {/* Card thumbnail list */}
                            <div style={{
                                width: '100%', marginTop: 20, maxHeight: 280, overflowY: 'auto',
                                display: 'flex', flexDirection: 'column', gap: 6,
                            }}>
                                {cards.map((card, i) => (
                                    <div
                                        key={i}
                                        onClick={() => { setFlipped(false); setCurrentCard(i); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            cursor: 'pointer',
                                            background: i === currentCard ? 'rgba(75,43,238,0.1)' : '#1a1921',
                                            border: `1px solid ${i === currentCard ? 'rgba(75,43,238,0.35)' : 'var(--border-subtle)'}`,
                                            transition: 'all 150ms ease',
                                        }}
                                    >
                                        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, paddingRight: 8 }}>
                                            <span style={{
                                                fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginRight: 8,
                                            }}>
                                                {i + 1}.
                                            </span>
                                            <span style={{
                                                fontSize: 13, color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>
                                                {card.question}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => { e.stopPropagation(); deleteCard(i); }}
                                            style={{ color: 'var(--text-muted)', padding: '2px 6px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                            title="Delete card"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: 12, padding: '48px 16px', textAlign: 'center',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--border-subtle)' }}>
                                style
                            </span>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                Generated flashcards will appear here for review before saving.
                            </p>
                        </div>
                    )}

                    {/* Add card manually */}
                    {showAddCard ? (
                        <div style={{ width: '100%', marginTop: 16, padding: 14, background: '#1c1c23', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                            <input className="input" placeholder="Question" value={newQ} onChange={(e) => setNewQ(e.target.value)} style={{ marginBottom: 8 }} />
                            <input className="input" placeholder="Answer" value={newA} onChange={(e) => setNewA(e.target.value)} style={{ marginBottom: 12 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={addManualCard}>Add Card</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddCard(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn btn-ghost btn-full"
                            style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
                            onClick={() => setShowAddCard(true)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                            Add Card Manually
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
