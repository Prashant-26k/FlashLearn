import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Modal from '../components/Modal';
import { useToast } from '../context/useToast';
import api from '../utils/api';

function ToggleRow({ label, description, checked, onChange }) {
    return (
        <div className="stitch-settings-row">
            <div>
                <div className="stitch-settings-row-label">{label}</div>
                {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
            </div>
            <button
                className={`toggle-switch ${checked ? 'active' : ''}`}
                onClick={onChange}
                role="switch"
                aria-checked={checked}
                aria-label={label}
            />
        </div>
    );
}

export default function Settings() {
    const { user, logout } = useAuth();
    const toast = useToast();

    const [prefs, setPrefs] = useState(() => {
        const saved = localStorage.getItem('flashlearn_prefs');
        return saved ? JSON.parse(saved) : {
            defaultOrder: 'random',
            defaultMode: 'mc',
            autoSave: true,
            includeNumbers: true,
            includeTitle: true,
            learningStyle: 'sequential', // 'sequential' | 'spaced'
        };
    });

    const [showClearModal, setShowClearModal] = useState(false);

    const updatePref = (key, value) => {
        const updated = { ...prefs, [key]: value };
        setPrefs(updated);
        localStorage.setItem('flashlearn_prefs', JSON.stringify(updated));
    };

    const handleExportAll = async () => {
        try {
            const decksRes = await api.get('/api/decks');
            const decks = decksRes.data || [];
            const content = decks.length
                ? decks.map((deck) => {
                    const cards = deck.cards || [];
                    const titleLine = prefs.includeTitle ? (deck.title || 'UNTITLED DECK') : '';
                    const cardsText = cards.map((card, index) => [
                        prefs.includeNumbers ? `${index + 1}. QUESTION` : 'QUESTION',
                        card.question || '',
                        'ANSWER',
                        card.answer || '',
                    ].join('\n')).join('\n\n');
                    return [titleLine, '='.repeat(Math.max(20, titleLine.length)), cardsText || 'No cards in this deck.'].filter(Boolean).join('\n\n');
                }).join('\n\n\n' + '-'.repeat(60) + '\n\n\n')
                : 'No decks available.';
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flashlearn-decks.txt';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Data exported');
        } catch {
            toast.error('Export failed');
        }
    };

    const handleClearAll = async () => {
        try {
            const res = await api.get('/api/decks');
            const decks = res.data || [];
            await Promise.all(decks.map(d => api.delete(`/api/decks/${d._id}`)));
            toast.success('All decks cleared');
        } catch {
            toast.error('Failed to clear decks');
        }
        setShowClearModal(false);
    };

    return (
        <div className="page-enter stitch-screen" style={{ maxWidth: 620, margin: '0 auto' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 28 }}>Settings</h1>

            {/* ── Account Section ── */}
            <div className="stitch-settings-section">
                <div className="stitch-settings-section-title">Account</div>
                <div className="stitch-account-card">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.displayName} className="stitch-account-avatar" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="stitch-account-avatar-fallback">
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.displayName || 'User'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.email || ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(161,161,170,0.7)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
                            Google Account
                        </div>
                    </div>
                </div>

                <div style={{ padding: '4px 0 12px' }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 16px', borderRadius: 10,
                            background: 'rgba(248,113,113,0.06)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            color: '#f87171', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
                            transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* ── Learning Style ── */}
            <div className="stitch-settings-section">
                <div className="stitch-settings-section-title">Learning Style</div>
                <div className="stitch-settings-card">
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                        Choose how cards are presented during study sessions.
                    </p>
                    <div className="stitch-learning-style">
                        <button
                            className={`stitch-learning-style-btn ${prefs.learningStyle === 'sequential' ? 'active' : ''}`}
                            onClick={() => updatePref('learningStyle', 'sequential')}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sort</span>
                            Normal Sequential
                        </button>
                        <button
                            className={`stitch-learning-style-btn ${prefs.learningStyle === 'spaced' ? 'active' : ''}`}
                            onClick={() => updatePref('learningStyle', 'spaced')}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>repeat</span>
                            Spaced Repetition
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Defaults ── */}
            <div className="stitch-settings-section">
                <div className="stitch-settings-section-title">Defaults</div>
                <div className="stitch-settings-card">
                    <div className="stitch-settings-row">
                        <div className="stitch-settings-row-label">Default card order</div>
                        <div className="stitch-select-wrap">
                            <select
                                value={prefs.defaultOrder}
                                onChange={(e) => updatePref('defaultOrder', e.target.value)}
                            >
                                <option value="random">Random</option>
                                <option value="sequential">Sequential</option>
                            </select>
                            <span className="material-symbols-outlined stitch-select-icon">expand_more</span>
                        </div>
                    </div>
                    <div className="stitch-settings-row">
                        <div className="stitch-settings-row-label">Default quiz mode</div>
                        <div className="stitch-select-wrap">
                            <select
                                value={prefs.defaultMode}
                                onChange={(e) => updatePref('defaultMode', e.target.value)}
                            >
                                <option value="mc">Multiple Choice</option>
                                <option value="type">Type Answer</option>
                            </select>
                            <span className="material-symbols-outlined stitch-select-icon">expand_more</span>
                        </div>
                    </div>
                    <ToggleRow
                        label="Auto-save decks"
                        description="Automatically save changes as you edit"
                        checked={prefs.autoSave}
                        onChange={() => updatePref('autoSave', !prefs.autoSave)}
                    />
                </div>
            </div>

            {/* ── Export Preferences ── */}
            <div className="stitch-settings-section">
                <div className="stitch-settings-section-title">Export Preferences</div>
                <div className="stitch-settings-card">
                    <ToggleRow
                        label="Include question numbers"
                        checked={prefs.includeNumbers}
                        onChange={() => updatePref('includeNumbers', !prefs.includeNumbers)}
                    />
                    <ToggleRow
                        label="Include deck title in export"
                        checked={prefs.includeTitle}
                        onChange={() => updatePref('includeTitle', !prefs.includeTitle)}
                    />
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
                        <button
                            onClick={handleExportAll}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 16px', borderRadius: 10,
                                background: '#222228', border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)', cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                                transition: 'all 150ms ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#2c2c33'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#222228'}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>file_download</span>
                            Export All Data
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Danger Zone ── */}
            <div className="stitch-settings-section">
                <div className="stitch-settings-section-title" style={{ color: '#f87171' }}>Danger Zone</div>
                <div className="stitch-settings-card" style={{ borderColor: 'rgba(248,113,113,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Clear All Decks</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permanently delete all decks and cards</div>
                        </div>
                        <button
                            onClick={() => setShowClearModal(true)}
                            style={{
                                padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)',
                                background: 'rgba(248,113,113,0.06)', color: '#f87171', cursor: 'pointer',
                                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, flexShrink: 0,
                                transition: 'all 150ms ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                        >
                            Clear All Decks
                        </button>
                    </div>
                </div>
            </div>

            {/* Clear confirmation modal */}
            <Modal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Clear All Decks"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleClearAll}>Clear All</button>
                    </>
                }
            >
                <div style={{ color: 'var(--text-secondary)' }}>
                    Are you sure? This will <strong style={{ color: '#f87171' }}>permanently delete all your decks and cards</strong>. This action cannot be undone.
                </div>
            </Modal>
        </div>
    );
}
