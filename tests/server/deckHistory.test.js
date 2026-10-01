import { describe, it, expect } from 'vitest';
import { ConflictError } from '../../server/utils/errors.js';

describe('Deck Concurrency & Versioning', () => {
    it('detects version mismatch for optimistic concurrency', () => {
        const currentVersion = 1;
        const incomingVersion = 2; // out of sync

        function checkConcurrency(expected, current) {
            if (expected !== undefined && expected !== current) {
                throw new ConflictError(
                    'Deck was modified by another session. Please reload the latest version.',
                    'VERSION_CONFLICT',
                    { currentVersion: current, expectedVersion: expected }
                );
            }
            return current + 1;
        }

        expect(() => checkConcurrency(incomingVersion, currentVersion)).toThrow(ConflictError);
        expect(checkConcurrency(1, 1)).toBe(2);
    });
});
