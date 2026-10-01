import { describe, it, expect } from 'vitest';
import { runWithConcurrency } from '../../server/utils/concurrency.js';

describe('Concurrency Limiter', () => {
    it('executes tasks within maximum concurrency limit', async () => {
        let active = 0;
        let peakActive = 0;

        const tasks = [1, 2, 3, 4, 5, 6, 7];
        const results = await runWithConcurrency(tasks, 3, async (num) => {
            active += 1;
            peakActive = Math.max(peakActive, active);
            await new Promise(resolve => setTimeout(resolve, 20));
            active -= 1;
            return num * 2;
        });

        expect(results).toEqual([2, 4, 6, 8, 10, 12, 14]);
        expect(peakActive).toBeLessThanOrEqual(3);
    });

    it('preserves order of results irrespective of task completion time', async () => {
        const delays = [50, 10, 30, 5];
        const results = await runWithConcurrency(delays, 2, async (delay, idx) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            return `done-${idx}`;
        });

        expect(results).toEqual(['done-0', 'done-1', 'done-2', 'done-3']);
    });
});
