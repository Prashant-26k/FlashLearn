import { describe, it, expect } from 'vitest';
import { getStudyQueue, reviewCard } from '../../src/utils/spacedRepetition.js';

describe('Spaced Repetition Engine', () => {
    it('returns cards due for review first', () => {
        const now = new Date('2026-01-10T12:00:00Z');
        const cards = [
            { question: 'Q1', answer: 'A1', dueAt: new Date('2026-01-12T12:00:00Z') }, // future
            { question: 'Q2', answer: 'A2', dueAt: new Date('2026-01-08T12:00:00Z') }, // overdue
            { question: 'Q3', answer: 'A3', dueAt: null }, // unstudied
        ];

        const queue = getStudyQueue(cards, now);
        expect(queue).toEqual([2, 1]); // Q3 (due null/0), Q2 (overdue)
    });

    it('returns the next due card if no cards are currently overdue', () => {
        const now = new Date('2026-01-10T12:00:00Z');
        const cards = [
            { question: 'Q1', answer: 'A1', dueAt: new Date('2026-01-15T12:00:00Z') },
            { question: 'Q2', answer: 'A2', dueAt: new Date('2026-01-12T12:00:00Z') },
        ];

        const queue = getStudyQueue(cards, now);
        expect(queue).toEqual([1]); // Q2 is closest
    });

    it('adjusts repetitions and intervals correctly on "good" review', () => {
        const now = new Date('2026-01-10T12:00:00Z');
        const card = { question: 'Q', answer: 'A', intervalDays: 1, repetitions: 1, easeFactor: 2.5 };

        const reviewed = reviewCard(card, 'good', now);
        expect(reviewed.repetitions).toBe(2);
        expect(reviewed.intervalDays).toBe(1);
        expect(reviewed.lapses).toBe(0);
        expect(reviewed.dueAt.getTime()).toBe(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    });

    it('resets interval and increments lapses on "again" review', () => {
        const now = new Date('2026-01-10T12:00:00Z');
        const card = { question: 'Q', answer: 'A', intervalDays: 5, repetitions: 3, lapses: 0, easeFactor: 2.5 };

        const reviewed = reviewCard(card, 'again', now);
        expect(reviewed.intervalDays).toBe(0);
        expect(reviewed.repetitions).toBe(3); // repetitions not incremented on fail
        expect(reviewed.lapses).toBe(1);
        expect(reviewed.easeFactor).toBeLessThan(2.5);
    });

    it('multiplies interval on "easy" review', () => {
        const now = new Date('2026-01-10T12:00:00Z');
        const card = { question: 'Q', answer: 'A', intervalDays: 2, repetitions: 2, easeFactor: 2.5 };

        const reviewed = reviewCard(card, 'easy', now);
        expect(reviewed.repetitions).toBe(3);
        expect(reviewed.intervalDays).toBe(8); // 2 * 4
        expect(reviewed.easeFactor).toBeGreaterThan(2.5);
    });

    it('throws error for invalid review rating', () => {
        const card = { question: 'Q', answer: 'A' };
        expect(() => reviewCard(card, 'invalid')).toThrow('Invalid review rating');
    });
});
