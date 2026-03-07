import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Settings() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // Preferences (persisted in localStorage)
    const [prefs, setPrefs] = useState(() => {
        const saved = localStorage.getItem('flashlearn_prefs');
        return saved ? JSON.parse(saved) : {
            defaultOrder: 'random',
            defaultMode: 'mc',
            autoSave: true,
            includeNumbers: true,
            includeTitle: true,
            fontSize: 'default',
            flipSpeed: 'normal',
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
            const [decksRes, colsRes] = await Promise.all([
                api.get('/api/decks'),
                api.get('/api/collections'),
            ]);
            const data = {
                exportedAt: new Date().toISOString(),
                decks: decksRes.data,
                collections: colsRes.data,
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flashlearn-backup.txt';
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

    const sectionStyle = {
        marginBottom: 40,
    };
    const sectionTitle = {
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 16,
    };
    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
    };

    return (
        <div className="page-enter" style={{ maxWidth: 640, margin: '0 auto', padding: '48px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ fontSize: 18, padding: '0 8px' }}>←</button>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Settings</h1>
            </div>

            {/* ── Account ── */}
            <div style={sectionStyle}>
                <h2 style={sectionTitle}>Account</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }} referrerPolicy="no-referrer" />
                    ) : (
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, fontWeight: 700, color: '#fff',
                        }}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{user?.displayName || 'User'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{user?.email || ''}</div>
                    </div>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 16 }}>
                    Account details are managed through your Google account
                </p>
                <button className="btn btn-danger" onClick={logout}>Sign Out</button>
            </div>

            {/* ── Preferences ── */}
            <div style={sectionStyle}>
                <h2 style={sectionTitle}>Preferences</h2>
                <div style={rowStyle}>
                    <span>Default card order</span>
                    <select
                        className="select"
                        value={prefs.defaultOrder}
                        onChange={(e) => updatePref('defaultOrder', e.target.value)}
                        style={{ width: 160 }}
                    >
                        <option value="random">Random</option>
                        <option value="sequential">Sequential</option>
                    </select>
                </div>
                <div style={rowStyle}>
                    <span>Default quiz mode</span>
                    <select
                        className="select"
                        value={prefs.defaultMode}
                        onChange={(e) => updatePref('defaultMode', e.target.value)}
                        style={{ width: 160 }}
                    >
                        <option value="mc">Multiple Choice</option>
                        <option value="type">Type Answer</option>
                    </select>
                </div>
                <div style={rowStyle}>
                    <span>Auto-save decks</span>
                    <button
                        className={`toggle-switch ${prefs.autoSave ? 'active' : ''}`}
                        onClick={() => updatePref('autoSave', !prefs.autoSave)}
                    />
                </div>
            </div>

            {/* ── Export Preferences ── */}
            <div style={sectionStyle}>
                <h2 style={sectionTitle}>Export Preferences</h2>
                <div style={rowStyle}>
                    <span>Include question numbers</span>
                    <button
                        className={`toggle-switch ${prefs.includeNumbers ? 'active' : ''}`}
                        onClick={() => updatePref('includeNumbers', !prefs.includeNumbers)}
                    />
                </div>
                <div style={rowStyle}>
                    <span>Include deck title</span>
                    <button
                        className={`toggle-switch ${prefs.includeTitle ? 'active' : ''}`}
                        onClick={() => updatePref('includeTitle', !prefs.includeTitle)}
                    />
                </div>
            </div>



            {/* ── Data ── */}
            <div style={sectionStyle}>
                <h2 style={sectionTitle}>Data</h2>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="btn btn-secondary" onClick={handleExportAll}>Export All Data</button>
                    <button className="btn btn-danger" onClick={() => setShowClearModal(true)}>Clear All Decks</button>
                </div>
            </div>

            {/* Clear confirmation */}
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
                Are you sure? This will permanently delete all your decks and cards. This cannot be undone.
            </Modal>
        </div>
    );
}
