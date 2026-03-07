import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function Quiz() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [step, setStep] = useState(1); // 1=setup, 2=quiz, 3=results
    const [decks, setDecks] = useState([]);
    const [selectedDecks, setSelectedDecks] = useState([]);
    const [settings, setSettings] = useState({
        order: 'random',
        mode: 'mc',
        timeEnabled: false,
        timeLimit: 30,
    });
    const [loading, setLoading] = useState(true);

    // Quiz state
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [typedAnswer, setTypedAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        loadDecks();
        const preselect = searchParams.get('deckId');
        if (preselect) setSelectedDecks([preselect]);
    }, []);

    const loadDecks = async () => {
        try {
            const res = await api.get('/api/decks');
            setDecks(res.data || []);
        } catch { }
        setLoading(false);
    };

    const toggleDeck = (id) => {
        setSelectedDecks(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const startQuiz = () => {
        // Collect all cards from selected decks
        let allCards = [];
        decks.forEach(d => {
            if (selectedDecks.includes(d._id)) {
                (d.cards || []).forEach(c => allCards.push({ ...c, deckTitle: d.title }));
            }
        });

        if (!allCards.length) return toast.error('Selected decks have no cards');

        if (settings.order === 'random') {
            allCards.sort(() => Math.random() - 0.5);
        }

        // Generate MC options for each question
        const processed = allCards.map((card, idx) => {
            if (settings.mode === 'mc') {
                // Get 3 wrong answers from other cards
                const others = allCards.filter((_, i) => i !== idx);
                const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
                const options = [...shuffled.map(c => c.answer), card.answer].sort(() => Math.random() - 0.5);
                return { ...card, options };
            }
            return card;
        });

        setQuestions(processed);
        setAnswers(new Array(processed.length).fill(null));
        setCurrentQ(0);
        setSelected(null);
        setShowResult(false);
        setTypedAnswer('');
        setStep(2);
        if (settings.timeEnabled) setTimeLeft(settings.timeLimit);
    };

    // Timer
    useEffect(() => {
        if (step !== 2 || !settings.timeEnabled || showResult) return;
        if (timeLeft <= 0) {
            handleAnswer(null);
            return;
        }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [step, timeLeft, settings.timeEnabled, showResult]);

    const handleAnswer = (answer) => {
        const correct = questions[currentQ]?.answer;
        const isCorrect = answer?.toLowerCase?.()?.trim() === correct?.toLowerCase?.()?.trim();
        const newAnswers = [...answers];
        newAnswers[currentQ] = { given: answer, correct, isCorrect };
        setAnswers(newAnswers);
        setSelected(answer);
        setShowResult(true);
    };

    const nextQuestion = () => {
        if (currentQ >= questions.length - 1) {
            // Quiz done
            submitResults();
            setStep(3);
            return;
        }
        setCurrentQ(currentQ + 1);
        setSelected(null);
        setShowResult(false);
        setTypedAnswer('');
        if (settings.timeEnabled) setTimeLeft(settings.timeLimit);
    };

    const submitResults = async () => {
        const score = answers.filter(a => a?.isCorrect).length;
        try {
            await api.post('/api/quiz/result', {
                deckIds: selectedDecks,
                score,
                total: questions.length,
            });
        } catch { }
    };

    const score = answers.filter(a => a?.isCorrect).length;
    const incorrect = answers.filter(a => a && !a.isCorrect).length;
    const skipped = answers.filter(a => a === null).length;
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    // ─── Step 1: Setup ───
    if (step === 1) {
        return (
            <div className="page-enter">
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 24 }}>Configure Quiz</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
                    {/* Deck Selection */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Select Decks</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDecks(decks.map(d => d._id))}>
                                    Select All
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDecks([])}>
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
                            </div>
                        ) : decks.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {decks.map(deck => (
                                    <label
                                        key={deck._id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px', background: 'var(--bg-elevated)',
                                            border: `1px solid ${selectedDecks.includes(deck._id) ? 'var(--accent)' : 'var(--border-subtle)'}`,
                                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                            transition: 'border-color 150ms ease',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDecks.includes(deck._id)}
                                            onChange={() => toggleDeck(deck._id)}
                                            style={{ accentColor: 'var(--accent)' }}
                                        />
                                        <span style={{ fontWeight: 500 }}>{deck.title}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginLeft: 'auto' }}>
                                            {deck.cards?.length || 0} cards
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No decks available. Create some first.</p>
                        )}
                    </div>

                    {/* Settings Panel */}
                    <div style={{
                        background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)', padding: 24,
                        height: 'fit-content',
                    }}>
                        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 20 }}>Settings</h3>

                        {/* Card Order */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                Card Order
                            </label>
                            {['random', 'sequential'].map(opt => (
                                <label key={opt} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                                    cursor: 'pointer', fontSize: 'var(--text-sm)',
                                }}>
                                    <input
                                        type="radio" name="order" value={opt}
                                        checked={settings.order === opt}
                                        onChange={() => setSettings({ ...settings, order: opt })}
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </label>
                            ))}
                        </div>

                        {/* Answer Mode */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                Answer Mode
                            </label>
                            {[['mc', 'Multiple Choice'], ['type', 'Type Answer']].map(([val, label]) => (
                                <label key={val} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                                    cursor: 'pointer', fontSize: 'var(--text-sm)',
                                }}>
                                    <input
                                        type="radio" name="mode" value={val}
                                        checked={settings.mode === val}
                                        onChange={() => setSettings({ ...settings, mode: val })}
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>

                        {/* Time Limit */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Time Limit</label>
                                <button
                                    className={`toggle-switch ${settings.timeEnabled ? 'active' : ''}`}
                                    onClick={() => setSettings({ ...settings, timeEnabled: !settings.timeEnabled })}
                                />
                            </div>
                            {settings.timeEnabled && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        className="input"
                                        type="number" min="5" max="120"
                                        value={settings.timeLimit}
                                        onChange={(e) => setSettings({ ...settings, timeLimit: parseInt(e.target.value) || 30 })}
                                        style={{ width: 80 }}
                                    />
                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>seconds per question</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary btn-lg"
                    style={{ marginTop: 32, width: 200 }}
                    onClick={startQuiz}
                    disabled={selectedDecks.length === 0}
                >
                    Start Quiz
                </button>
            </div>
        );
    }

    // ─── Step 2: Quiz In Progress ───
    if (step === 2) {
        const question = questions[currentQ];
        const progress = ((currentQ + 1) / questions.length) * 100;

        return (
            <div className="page-enter">
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div className="progress-bar" style={{ flex: 1, marginRight: 16 }}>
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Question {currentQ + 1} of {questions.length}
                    </span>
                </div>

                {/* Timer */}
                {settings.timeEnabled && (
                    <div style={{
                        textAlign: 'right', marginBottom: 16,
                        fontSize: 'var(--text-2xl)', fontWeight: 700,
                        color: timeLeft <= 2 ? 'var(--danger)' : timeLeft <= 5 ? 'var(--warning)' : 'var(--text-primary)',
                    }}>
                        {timeLeft}s
                    </div>
                )}

                {/* Question */}
                <div style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center',
                    marginBottom: 24, minHeight: 120, display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <p style={{ fontSize: 'var(--text-lg)', fontWeight: 500 }}>{question?.question}</p>
                </div>

                {/* Answer area */}
                {settings.mode === 'mc' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {question?.options?.map((opt, i) => {
                            let cls = 'quiz-option';
                            if (showResult) {
                                if (opt === question.answer) cls += ' correct show-correct';
                                else if (opt === selected) cls += ' incorrect';
                            }
                            return (
                                <button
                                    key={i}
                                    className={cls}
                                    onClick={() => !showResult && handleAnswer(opt)}
                                    disabled={showResult}
                                >
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                    }}>
                                        {showResult && opt === question.answer && <span style={{ color: 'var(--success)' }}>✓</span>}
                                        {showResult && opt === selected && opt !== question.answer && <span style={{ color: 'var(--danger)' }}>✗</span>}
                                        {opt}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="input"
                                placeholder="Type your answer..."
                                value={typedAnswer}
                                onChange={(e) => setTypedAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !showResult && handleAnswer(typedAnswer)}
                                disabled={showResult}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => handleAnswer(typedAnswer)}
                                disabled={showResult}
                            >
                                Submit
                            </button>
                        </div>
                        {showResult && (
                            <div style={{
                                marginTop: 12, padding: 12, borderRadius: 'var(--radius-sm)',
                                background: answers[currentQ]?.isCorrect ? 'rgba(76,175,130,0.1)' : 'rgba(224,82,82,0.1)',
                                border: `1px solid ${answers[currentQ]?.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                            }}>
                                <span style={{ color: answers[currentQ]?.isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                    {answers[currentQ]?.isCorrect ? '✓ Correct!' : `✗ Incorrect. Correct answer: ${question?.answer}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Next button */}
                {showResult && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <button className="btn btn-primary btn-lg" onClick={nextQuestion}>
                            {currentQ >= questions.length - 1 ? 'Finish Quiz' : 'Next Question →'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─── Step 3: Results ───
    return (
        <div className="page-enter" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 32 }}>Quiz Complete</h1>

            {/* Score Ring */}
            <div className="score-ring-container" style={{ marginBottom: 32 }}>
                <svg width="140" height="140" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
                    <circle
                        cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                </svg>
                <div className="score-ring-text">
                    <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{score} / {questions.length}</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{pct}%</span>
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
                {[
                    { label: 'Correct', value: score, color: 'var(--success)', bg: 'rgba(76,175,130,0.1)' },
                    { label: 'Incorrect', value: incorrect, color: 'var(--danger)', bg: 'rgba(224,82,82,0.1)' },
                    { label: 'Skipped', value: skipped, color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
                ].map(stat => (
                    <div key={stat.label} style={{
                        padding: '16px 24px', borderRadius: 'var(--radius-md)',
                        background: stat.bg, border: `1px solid ${stat.color}22`,
                        textAlign: 'center', minWidth: 100,
                    }}>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Review wrong answers */}
            {incorrect > 0 && (
                <div style={{ textAlign: 'left', marginBottom: 32 }}>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 12 }}>Review Wrong Answers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {answers.map((a, i) => {
                            if (!a || a.isCorrect) return null;
                            return (
                                <div key={i} style={{
                                    padding: 16, background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
                                }}>
                                    <p style={{ fontWeight: 500, marginBottom: 8 }}>{questions[i]?.question}</p>
                                    <p style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>
                                        Your answer: {a.given || '(skipped)'}
                                    </p>
                                    <p style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>
                                        Correct answer: {a.correct}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { setStep(1); setAnswers([]); setCurrentQ(0); }}>
                    Retry Quiz
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/decks')}>
                    Return to Decks
                </button>
            </div>
        </div>
    );
}
