import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/useToast';
import api from '../utils/api';
import { getCached, setCached, invalidateCache } from '../utils/cache';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function Quiz() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [step, setStep] = useState(1); // 1=setup, 2=quiz, 3=results
    const [decks, setDecks] = useState(() => getCached('decks') || []);
    const [selectedDecks, setSelectedDecks] = useState(() => {
        const preselect = searchParams.get('deckId');
        return preselect ? [preselect] : [];
    });
    const [settings, setSettings] = useState({
        order: 'random',
        mode: 'mc',
        timeEnabled: false,
        timeLimit: 30,
    });
    const [loading, setLoading] = useState(() => !getCached('decks'));

    // Quiz runtime state
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [typedAnswer, setTypedAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        let mounted = true;
        api.get('/api/decks')
            .then(res => {
                if (!mounted) return;
                const data = res.data || [];
                setDecks(data);
                setCached('decks', data, 60000);
            })
            .catch(() => { /* offline / backend not running */ })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, []);

    const toggleDeck = (id) => {
        setSelectedDecks(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const startQuiz = () => {
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

        const processed = allCards.map((card, idx) => {
            if (settings.mode === 'mc') {
                const others = allCards.filter((_, i) => i !== idx);
                const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
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

    const handleAnswer = useCallback((answer) => {
        const correct = questions[currentQ]?.answer;
        const isCorrect = answer?.toLowerCase?.()?.trim() === correct?.toLowerCase?.()?.trim();
        setAnswers(prev => {
            const next = [...prev];
            next[currentQ] = { given: answer, correct, isCorrect };
            return next;
        });
        setSelected(answer);
        setShowResult(true);
    }, [questions, currentQ]);

    // Timer
    useEffect(() => {
        if (step !== 2 || !settings.timeEnabled || showResult) return;
        const timer = setTimeout(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    handleAnswer(null);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [step, settings.timeEnabled, showResult, handleAnswer]);

    const nextQuestion = () => {
        if (currentQ >= questions.length - 1) {
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
            // Invalidate quiz stats cache so dashboard refreshes
            invalidateCache('quiz_stats');
        } catch { /* ignore network error on save */ }
    };

    const score = answers.filter(a => a?.isCorrect).length;
    const incorrect = answers.filter(a => a && !a.isCorrect).length;
    const skipped = answers.filter(a => a === null).length;
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    // ─── Step 1: Setup ───
    if (step === 1) {
        return (
            <div className="page-enter stitch-screen">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(-1)}
                        style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: '#17171c' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                    </button>
                    <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Configure Quiz</h1>
                </div>

                <div className="quiz-setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

                    {/* Deck Selection */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Select Decks</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDecks(decks.map(d => d._id))}>
                                    Select All
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDecks([])}>
                                    Clear
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />)}
                            </div>
                        ) : decks.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {decks.map(deck => {
                                    const isChecked = selectedDecks.includes(deck._id);
                                    return (
                                        <label
                                            key={deck._id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 14,
                                                padding: '14px 18px',
                                                background: isChecked ? 'rgba(75,43,238,0.08)' : '#17171c',
                                                border: `1px solid ${isChecked ? 'var(--accent)' : 'var(--border-subtle)'}`,
                                                borderRadius: 12, cursor: 'pointer',
                                                transition: 'all 150ms ease',
                                            }}
                                        >
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                                border: `2px solid ${isChecked ? 'var(--accent)' : '#4a4a5a'}`,
                                                background: isChecked ? 'var(--accent)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 150ms ease',
                                            }}>
                                                {isChecked && (
                                                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>check</span>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleDeck(deck._id)}
                                                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                                                tabIndex={-1}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {deck.title}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                                                {deck.cards?.length || 0} cards
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 10, display: 'block', opacity: 0.5 }}>layers</span>
                                No decks available. Create some first.
                            </div>
                        )}
                    </div>

                    {/* Settings Panel */}
                    <div style={{
                        background: '#17171c', borderRadius: 14,
                        border: '1px solid var(--border-subtle)', padding: 22,
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: 'var(--text-primary)' }}>Settings</h3>

                        {/* Card Order */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                                Card Order
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {['random', 'sequential'].map(opt => (
                                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                                        <div style={{
                                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                            border: `2px solid ${settings.order === opt ? 'var(--accent)' : '#4a4a5a'}`,
                                            background: settings.order === opt ? 'var(--accent)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {settings.order === opt && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                                        </div>
                                        <input type="radio" name="order" value={opt} checked={settings.order === opt} onChange={() => setSettings({ ...settings, order: opt })} style={{ display: 'none' }} />
                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Answer Mode */}
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                                Answer Mode
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[['mc', 'Multiple Choice'], ['type', 'Type Answer']].map(([val, label]) => (
                                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                                        <div style={{
                                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                            border: `2px solid ${settings.mode === val ? 'var(--accent)' : '#4a4a5a'}`,
                                            background: settings.mode === val ? 'var(--accent)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {settings.mode === val && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                                        </div>
                                        <input type="radio" name="mode" value={val} checked={settings.mode === val} onChange={() => setSettings({ ...settings, mode: val })} style={{ display: 'none' }} />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Time Limit */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Time Limit
                                </label>
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
                                        style={{ width: 72 }}
                                    />
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>sec / question</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ marginTop: 28, height: 48, width: 200, fontSize: 15, fontWeight: 600, borderRadius: 12 }}
                    onClick={startQuiz}
                    disabled={selectedDecks.length === 0}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
                    Start Quiz
                </button>
            </div>
        );
    }

    // ─── Step 2: Quiz In Progress ───
    if (step === 2) {
        const question = questions[currentQ];
        const progressPct = ((currentQ + 1) / questions.length) * 100;

        return (
            <div className="page-enter stitch-screen" style={{ maxWidth: 640, margin: '0 auto' }}>
                {/* Header bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <button
                        onClick={() => { if (window.confirm('Exit quiz? Progress will be lost.')) { setStep(1); setAnswers([]); setCurrentQ(0); } }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 999, display: 'flex', alignItems: 'center', transition: 'color 150ms' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        aria-label="Exit quiz"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
                    </button>
                    <h2 style={{ fontSize: 15, fontWeight: 600, textAlign: 'center', flex: 1 }}>
                        {question?.deckTitle || 'Quiz'}
                    </h2>
                    <div style={{ width: 36 }} /> {/* spacer */}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                            Question {currentQ + 1} of {questions.length}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                            {Math.round(progressPct)}%
                        </span>
                    </div>
                    <div className="stitch-quiz-progress-bar">
                        <div className="stitch-quiz-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                {/* Timer */}
                {settings.timeEnabled && (
                    <div style={{
                        textAlign: 'right', marginBottom: 12,
                        fontSize: 24, fontWeight: 700,
                        color: timeLeft <= 5 ? '#f87171' : timeLeft <= 10 ? '#f59e0b' : 'var(--text-primary)',
                    }}>
                        {timeLeft}s
                    </div>
                )}

                {/* Question Card */}
                <div className="stitch-quiz-question-card">
                    <p className="stitch-quiz-question-text">{question?.question}</p>
                </div>

                {/* Answer options */}
                {settings.mode === 'mc' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {question?.options?.map((opt, i) => {
                            let cls = 'stitch-quiz-option';
                            let state = '';
                            if (showResult) {
                                if (opt === question.answer) { cls += ' correct'; state = 'correct'; }
                                else if (opt === selected) { cls += ' incorrect'; state = 'incorrect'; }
                            } else if (opt === selected) {
                                cls += ' selected';
                                state = 'selected';
                            }
                            return (
                                <button
                                    key={i}
                                    className={cls}
                                    onClick={() => !showResult && handleAnswer(opt)}
                                    disabled={showResult}
                                >
                                    {/* Radio circle */}
                                    <div className="stitch-quiz-radio">
                                        <div className="stitch-quiz-radio-dot" />
                                    </div>
                                    {/* Letter */}
                                    <span className="stitch-quiz-letter">{LETTERS[i]}</span>
                                    {/* Text */}
                                    <span className="stitch-quiz-option-text">{opt}</span>
                                    {/* Result icon */}
                                    {showResult && state === 'correct' && (
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#34d399', marginLeft: 'auto', flexShrink: 0 }}>check_circle</span>
                                    )}
                                    {showResult && state === 'incorrect' && (
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#f87171', marginLeft: 'auto', flexShrink: 0 }}>cancel</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="input"
                                placeholder="Type your answer..."
                                value={typedAnswer}
                                onChange={(e) => setTypedAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !showResult && handleAnswer(typedAnswer)}
                                disabled={showResult}
                                style={{ flex: 1 }}
                                autoFocus
                            />
                        </div>
                        {showResult && (
                            <div style={{
                                marginTop: 10, padding: '10px 14px', borderRadius: 10,
                                background: answers[currentQ]?.isCorrect ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                                border: `1px solid ${answers[currentQ]?.isCorrect ? '#34d399' : '#f87171'}`,
                            }}>
                                <span style={{ color: answers[currentQ]?.isCorrect ? '#34d399' : '#f87171', fontWeight: 600, fontSize: 13 }}>
                                    {answers[currentQ]?.isCorrect
                                        ? '✓ Correct!'
                                        : `✗ Incorrect. Correct answer: ${question?.answer}`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit / Next */}
                {!showResult ? (
                    settings.mode === 'mc' ? (
                        <button
                            className="stitch-quiz-submit"
                            onClick={() => selected !== null && handleAnswer(selected)}
                            disabled={selected === null}
                        >
                            Submit Answer
                        </button>
                    ) : (
                        <button
                            className="stitch-quiz-submit"
                            onClick={() => handleAnswer(typedAnswer)}
                            disabled={!typedAnswer.trim()}
                        >
                            Submit Answer
                        </button>
                    )
                ) : (
                    <button
                        className="stitch-quiz-submit"
                        onClick={nextQuestion}
                    >
                        {currentQ >= questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        <span className="material-symbols-outlined" style={{ fontSize: 18, marginLeft: 6 }}>arrow_forward</span>
                    </button>
                )}
            </div>
        );
    }

    // ─── Step 3: Results ───
    const circumference = 2 * Math.PI * 44;
    const strokeOffset = circumference - (pct / 100) * circumference;

    return (
        <div className="page-enter stitch-screen" style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* Close/back */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <button
                    onClick={() => navigate('/decks')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8, borderRadius: 999, display: 'flex', alignItems: 'center' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
                </button>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', flex: 1, textAlign: 'center', paddingRight: 40 }}>
                    Quiz Complete!
                </h2>
            </div>

            {/* Results Body */}
            <div className="stitch-quiz-results">
                {/* Score Ring */}
                <div className="stitch-results-ring">
                    <svg width="200" height="200" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                        <defs>
                            <linearGradient id="ringGrad" x1="0%" x2="100%" y1="100%" y2="0%">
                                <stop offset="0%" stopColor="#4b2bee" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="44" fill="none" stroke="#1e1e1e" strokeWidth="6" />
                        <circle
                            cx="50" cy="50" r="44" fill="none"
                            stroke="url(#ringGrad)"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 800ms ease' }}
                        />
                    </svg>
                    <div className="stitch-results-score-text">
                        <span className="stitch-results-score-pct">{pct}%</span>
                        <span className="stitch-results-score-label">Score</span>
                    </div>
                </div>

                {/* Stats card */}
                <div className="stitch-results-stats-card">
                    <div className="stitch-results-message">
                        <h3>
                            {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Great job!' : pct >= 40 ? 'Good effort!' : 'Keep practicing!'}
                        </h3>
                        <p>
                            {pct >= 80
                                ? 'You are making excellent progress.'
                                : pct >= 60
                                ? 'You are doing well — keep it up.'
                                : 'Review the missed questions and try again.'}
                        </p>
                    </div>
                    <div className="stitch-results-grid">
                        <div className="stitch-results-stat-box">
                            <span className="stitch-results-stat-label">Correct</span>
                            <span className="stitch-results-stat-value">{score} / {questions.length}</span>
                        </div>
                        <div className="stitch-results-stat-box">
                            <span className="stitch-results-stat-label">Incorrect</span>
                            <span className="stitch-results-stat-value" style={{ color: '#f87171' }}>{incorrect}</span>
                        </div>
                        {skipped > 0 && (
                            <div className="stitch-results-stat-box" style={{ gridColumn: '1/-1' }}>
                                <span className="stitch-results-stat-label">Skipped</span>
                                <span className="stitch-results-stat-value" style={{ color: 'var(--text-muted)' }}>{skipped}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review wrong answers */}
                {incorrect > 0 && (
                    <div style={{ width: '100%' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, letterSpacing: '-0.01em' }}>
                            Review Missed Questions
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {answers.map((a, i) => {
                                if (!a || a.isCorrect) return null;
                                return (
                                    <div key={i} style={{
                                        padding: '14px 16px', background: '#17171c',
                                        border: '1px solid var(--border-subtle)', borderRadius: 12,
                                    }}>
                                        <p style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>{questions[i]?.question}</p>
                                        <p style={{ color: '#f87171', fontSize: 12 }}>
                                            Your answer: {a.given || '(skipped)'}
                                        </p>
                                        <p style={{ color: '#34d399', fontSize: 12 }}>
                                            Correct: {a.correct}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '24px 0 32px' }}>
                <button
                    onClick={() => navigate('/decks')}
                    style={{
                        width: '100%', height: 56, borderRadius: 14,
                        background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600,
                        transition: 'all 150ms ease', letterSpacing: '-0.01em',
                    }}
                >
                    Back to Decks
                </button>
                <button
                    onClick={() => { setStep(1); setAnswers([]); setCurrentQ(0); setSelected(null); setShowResult(false); }}
                    style={{
                        width: '100%', height: 56, borderRadius: 14,
                        background: 'transparent', color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)', cursor: 'pointer',
                        fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
                        transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    Retry Quiz
                </button>
            </div>
        </div>
    );
}
