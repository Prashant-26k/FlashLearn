import test from 'node:test';
import assert from 'node:assert/strict';
import { runWithConcurrency } from './concurrency.js';

test('concurrency runner never exceeds configured active workers', async () => {
    let active = 0;
    let maximum = 0;
    const results = await runWithConcurrency([1, 2, 3, 4, 5, 6], 3, async value => {
        active += 1;
        maximum = Math.max(maximum, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active -= 1;
        return value * 2;
    });
    assert.deepEqual(results, [2, 4, 6, 8, 10, 12]);
    assert.equal(maximum, 3);
});
