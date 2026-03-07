import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    const handleAction = (path) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            login();
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
            {/* Topbar for Homepage */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 32px', borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 20 }}>Flash</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 20 }}>Learn</span>
                </div>
                <div>
                    {isAuthenticated ? (
                        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={login}>
                            Sign In / Get Started
                        </button>
                    )}
                </div>
            </header>

            <main style={{ flex: 1, padding: '48px 24px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                {/* Hero Section */}
                <section style={{ textAlign: 'center', marginBottom: 80, marginTop: 40 }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800,
                        letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1,
                        background: 'linear-gradient(to right, #fff, #a1a1aa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Learn anything, faster.
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)', fontSize: 'var(--text-lg)',
                        maxWidth: 600, margin: '0 auto 32px'
                    }}>
                        Generate AI-powered flashcards from your notes, PDFs, or any topic. Start mastering your subjects today.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                        <button
                            className="btn btn-primary"
                            style={{ fontSize: '1.1rem', padding: '12px 24px', height: 'auto' }}
                            onClick={() => handleAction('/create')}
                        >
                            {isAuthenticated ? 'Create a Deck' : 'Start Generating'}
                        </button>
                    </div>
                </section>

                {/* Quick Access Links (for returning/power users) */}
                <section style={{ marginBottom: 64 }}>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
                        Quick Access
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <div
                            className="deck-card"
                            onClick={() => handleAction('/collections')}
                            style={{ textAlign: 'center', padding: '24px', cursor: 'pointer', borderTop: '3px solid var(--accent)' }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>◫</div>
                            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Collections</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 8 }}>
                                Organize your decks
                            </p>
                        </div>
                        <div
                            className="deck-card"
                            onClick={() => handleAction('/quiz')}
                            style={{ textAlign: 'center', padding: '24px', cursor: 'pointer', borderTop: '3px solid #4CAF82' }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
                            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Quiz Mode</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 8 }}>
                                Test your knowledge
                            </p>
                        </div>
                    </div>
                </section>

                {/* Feature Highlights (4 input methods) */}
                <section style={{ marginBottom: 80 }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
                        Four ways to generate
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                        <div className="deck-card" style={{ background: 'var(--bg-elevated)' }}>
                            <div style={{ fontSize: 24, marginBottom: 12, color: 'var(--accent)' }}>📝</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Text Paste</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Paste your raw notes or articles and instantly extract key concepts.
                            </p>
                        </div>
                        <div className="deck-card" style={{ background: 'var(--bg-elevated)' }}>
                            <div style={{ fontSize: 24, marginBottom: 12, color: '#E05252' }}>📄</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>PDF Upload</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Upload lecture slides or textbook chapters to turn them into study cards.
                            </p>
                        </div>
                        <div className="deck-card" style={{ background: 'var(--bg-elevated)' }}>
                            <div style={{ fontSize: 24, marginBottom: 12, color: '#5E6AD2' }}>📘</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Word Docs</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Seamlessly convert your Word document study guides into interactive decks.
                            </p>
                        </div>
                        <div className="deck-card" style={{ background: 'var(--bg-elevated)' }}>
                            <div style={{ fontSize: 24, marginBottom: 12, color: '#E8A320' }}>🔍</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Topic Search</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Enter any subject and let the AI build a comprehensive deck from scratch.
                            </p>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section style={{ marginBottom: 64, textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 32 }}>
                        How it works
                    </h2>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center',
                        position: 'relative'
                    }}>
                        {/* Step 1 */}
                        <div style={{ flex: '1 1 250px', maxWidth: 300, textAlign: 'center' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)',
                                border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', fontSize: 20, fontWeight: 700, color: 'var(--accent)'
                            }}>1</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Input</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Provide your source material using one of our four supported methods.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div style={{ flex: '1 1 250px', maxWidth: 300, textAlign: 'center' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)',
                                border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', fontSize: 20, fontWeight: 700, color: 'var(--accent)'
                            }}>2</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Generate</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Our AI analyzes the content and crafts perfect question-answer pairs.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div style={{ flex: '1 1 250px', maxWidth: 300, textAlign: 'center' }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)',
                                border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', fontSize: 20, fontWeight: 700, color: 'var(--accent)'
                            }}>3</div>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Study</h3>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                Review your cards, organize them into collections, and test yourself.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
