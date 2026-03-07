import { useState } from 'react';

export default function FlashCard({ question, answer, width = 520, height = 300, flipped: controlledFlipped, onFlip }) {
    const [internalFlipped, setInternalFlipped] = useState(false);

    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

    const toggleFlip = () => {
        if (onFlip) {
            onFlip(!isFlipped);
        } else {
            setInternalFlipped(!internalFlipped);
        }
    };

    return (
        <div className="card-scene" style={{ width, height }}>
            <div
                className={`card-inner ${isFlipped ? 'flipped' : ''}`}
                onClick={toggleFlip}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleFlip(); }}
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
