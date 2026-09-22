import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFlashcardResponse } from './schema.js';

test('canonical response validation removes duplicate cards', () => {
    const result = parseFlashcardResponse(JSON.stringify({
        flashcards: [
            { question: 'What is HTTP?', answer: 'A protocol.' },
            { question: 'what is http?', answer: 'a protocol.' },
        ],
    }));
    assert.equal(result.flashcards.length, 1);
});

test('canonical response validation rejects empty cards and unexpected fields', () => {
    assert.throws(() => parseFlashcardResponse(JSON.stringify({
        flashcards: [{ question: '', answer: 'answer' }],
    })));
    assert.throws(() => parseFlashcardResponse(JSON.stringify({
        flashcards: [{ question: 'question', answer: 'answer', provider: 'gemini' }],
    })));
});
