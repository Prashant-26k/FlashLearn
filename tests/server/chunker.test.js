import { describe, it, expect } from 'vitest';
import { chunkText } from '../../server/utils/chunker.js';

describe('Text Chunker', () => {
    it('returns empty array for empty or null text', () => {
        expect(chunkText('')).toEqual([]);
        expect(chunkText(null)).toEqual([]);
    });

    it('splits large text into chunks of specified size', () => {
        const text = 'A'.repeat(7000);
        const chunks = chunkText(text, 2500, 10);
        expect(chunks.length).toBe(3);
        expect(chunks[0].length).toBe(2500);
        expect(chunks[1].length).toBe(2500);
        expect(chunks[2].length).toBe(2000);
    });

    it('respects maxChunks limit to protect AI costs', () => {
        const text = 'B'.repeat(15000);
        const chunks = chunkText(text, 1000, 5);
        expect(chunks.length).toBe(5);
    });
});
