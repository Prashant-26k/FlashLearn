import { useState } from 'react';

export default function FlashCard({ question, answer, width = 520, height = 300 }) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="card-scene" style={{ width, height }}>
            <div
                className={`card-inner ${flipped ? 'flipped' : ''}`}
                onClick={() => setFlipped(!flipped)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setFlipped(!flipped); }}
            >
                <div className="card-face card-front">
                    <span className="card-label">Q</span>
                    <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {question}
                    </p>
                </div>
                <div className="card-face card-back">
                    <span className="card-label">A</span>
                    <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}
