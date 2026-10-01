import { describe, it, expect } from 'vitest';
import { calculateQuizStats, getDayKey } from '../../server/services/quizStats.js';

describe('Quiz Statistics & Streak Calculation', () => {
    it('calculates totals accurately', () => {
        const results = [
            { score: 8, total: 10, date: new Date('2026-03-01T10:00:00Z') },
            { score: 9, total: 10, date: new Date('2026-03-01T15:00:00Z') },
            { score: 5, total: 5, date: new Date('2026-03-02T12:00:00Z') },
        ];

        const stats = calculateQuizStats(results, { now: new Date('2026-03-02T18:00:00Z') });
        expect(stats.quizzesTaken).toBe(3);
        expect(stats.totalCorrect).toBe(22);
        expect(stats.totalQuestions).toBe(25);
        expect(stats.totalActiveDays).toBe(2);
    });

    it('calculates current and max streaks across consecutive days', () => {
        const results = [
            { score: 10, total: 10, date: new Date('2026-03-01T10:00:00Z') },
            { score: 10, total: 10, date: new Date('2026-03-02T10:00:00Z') },
            { score: 10, total: 10, date: new Date('2026-03-03T10:00:00Z') },
            // Gap on 03-04
            { score: 10, total: 10, date: new Date('2026-03-05T10:00:00Z') },
            { score: 10, total: 10, date: new Date('2026-03-06T10:00:00Z') },
        ];

        // If today is 03-06, streak is 2 (03-05, 03-06), max is 3 (03-01..03-03)
        const stats = calculateQuizStats(results, { now: new Date('2026-03-06T15:00:00Z') });
        expect(stats.currentStreak).toBe(2);
        expect(stats.maxStreak).toBe(3);
    });

    it('retains streak from yesterday if user has not yet taken a quiz today', () => {
        const results = [
            { score: 10, total: 10, date: new Date('2026-03-05T10:00:00Z') },
        ];

        const stats = calculateQuizStats(results, { now: new Date('2026-03-06T08:00:00Z') });
        expect(stats.currentStreak).toBe(1);
    });

    it('respects timezone offset in day calculations', () => {
        const date = new Date('2026-03-02T01:30:00Z');
        // New York is UTC-5 (offset = +300 minutes in JS getTimezoneOffset convention)
        const keyUtc = getDayKey(date, 0);
        const keyNy = getDayKey(date, 300);

        expect(keyUtc).toBe('2026-03-02');
        expect(keyNy).toBe('2026-03-01');
    });
});
