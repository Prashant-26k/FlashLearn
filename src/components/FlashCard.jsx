import React, { useState } from 'react';
import './Flashcard.css';
import { getFlipDuration } from '../utils/flipDuration';

export default function FlashCard({ question, answer, width = 520, height = 300, flipped: controlledFlipped, onFlip }) {
    const [internalFlipped, setInternalFlipped] = useState(false);

    const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

    const toggleFlip = () => {
        // 1. Always fire the callback if it was provided
        if (onFlip) {
            onFlip(!isFlipped);
        }
        // 2. Only update internal state if the component is NOT strictly controlled
        if (controlledFlipped === undefined) {
            setInternalFlipped(!isFlipped);
        }
    };

    // Safely parse the duration to ensure it has a time unit for CSS
    const rawDuration = getFlipDuration();
    const safeDuration = typeof rawDuration === 'number' ? `${rawDuration}s` : rawDuration;

    return (
        <div
            className={`flashcard-container card-scene ${isFlipped ? 'flipped' : ''}`}
            style={{ width, height }}
            onClick={toggleFlip}
            role="button"
            tabIndex={0}
            aria-label={`Flashcard: ${isFlipped ? 'Answer showing' : 'Question showing'}. Click or press spacebar to flip.`}
            aria-expanded={isFlipped}
            onKeyDown={(e) => { 
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault(); // Prevent page scroll on spacebar
                    toggleFlip(); 
                }
            }}
        >
            <div
                className={`flashcard-inner card-inner ${isFlipped ? 'flipped' : ''}`}
                style={{ '--flip-duration': safeDuration || '0.8s' }}
            >
                {/* Front Side */}
                <div className="flashcard-front card-face card-front">
                    <span className="card-label">Q</span>
                    <div className="card-content">
                        <span className="badge">Question</span>
                        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {question}
                        </p>
                    </div>
                </div>

                {/* Back Side */}
                <div className="flashcard-back card-face card-back">
                    <span className="card-label">A</span>
                    <div className="card-content">
                        <span className="badge">Answer</span>
                        <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>
                            {answer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { FlashCard as Flashcard };