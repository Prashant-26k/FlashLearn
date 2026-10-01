import { describe, it, expect } from 'vitest';
import { createDeckSchema, updateDeckSchema, deckIdParamSchema } from '../../server/modules/decks/schema.js';
import { saveQuizResultSchema } from '../../server/modules/quiz/schema.js';
import { generateTextSchema } from '../../server/modules/generation/schema.js';

describe('Zod Input Validation Schemas', () => {
    describe('Deck Schemas', () => {
        it('validates valid deck creation payload', () => {
            const valid = {
                title: 'Biology 101',
                topic: 'Science',
                cards: [
                    { question: 'What is mitochondria?', answer: 'Powerhouse of the cell' },
                ],
            };
            const result = createDeckSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('rejects empty deck title', () => {
            const invalid = { title: '   ', cards: [] };
            const result = createDeckSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('validates optimistic concurrency version field in update schema', () => {
            const validUpdate = {
                title: 'New Title',
                version: 2,
            };
            const result = updateDeckSchema.safeParse(validUpdate);
            expect(result.success).toBe(true);
        });

        it('validates 24-character hexadecimal ObjectId', () => {
            expect(deckIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' }).success).toBe(true);
            expect(deckIdParamSchema.safeParse({ id: 'invalid_id' }).success).toBe(false);
            expect(deckIdParamSchema.safeParse({ id: '123' }).success).toBe(false);
        });
    });

    describe('Quiz Schemas', () => {
        it('rejects score greater than total', () => {
            const invalid = { score: 11, total: 10 };
            const result = saveQuizResultSchema.safeParse(invalid);
            expect(result.success).toBe(false);
        });

        it('accepts valid score and total', () => {
            const valid = { score: 8, total: 10 };
            const result = saveQuizResultSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });
    });

    describe('Generation Schemas', () => {
        it('rejects text exceeding 15000 characters', () => {
            const excessive = { text: 'a'.repeat(15001) };
            const result = generateTextSchema.safeParse(excessive);
            expect(result.success).toBe(false);
        });

        it('accepts valid prompt text', () => {
            const valid = { text: 'Important concepts in quantum physics' };
            const result = generateTextSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });
    });
});
