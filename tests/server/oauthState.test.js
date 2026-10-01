import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { createOAuthState, isValidOAuthState } from '../../server/modules/auth/controller.js';

describe('OAuth State Security & Validation Suite', () => {
    const originalSecret = process.env.JWT_SECRET;
    const testSecret = '0123456789abcdef0123456789abcdef';

    beforeEach(() => {
        process.env.JWT_SECRET = testSecret;
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it('generates a 3-part signed state with value, timestamp, and hmac signature', () => {
        const state = createOAuthState();
        expect(state).toBeTruthy();
        const parts = state.split('.');
        expect(parts.length).toBe(3);
        const [value, timestamp, signature] = parts;
        expect(value.length).toBe(64); // 32 hex bytes
        expect(Number(timestamp)).toBeGreaterThan(0);
        expect(signature.length).toBe(64); // sha256 hex length
    });

    it('successfully validates genuine freshly created state', () => {
        const state = createOAuthState();
        expect(isValidOAuthState(state)).toBe(true);
    });

    it('rejects tampered state signatures', () => {
        const state = createOAuthState();
        const parts = state.split('.');
        // Tamper with the random value
        const tamperedValue = parts[0].slice(0, -1) + (parts[0].endsWith('a') ? 'b' : 'a');
        const tamperedState = `${tamperedValue}.${parts[1]}.${parts[2]}`;
        expect(isValidOAuthState(tamperedState)).toBe(false);
    });

    it('rejects expired state (>15 minutes old)', () => {
        const sixteenMinutesAgo = Date.now() - 16 * 60 * 1000;
        const value = crypto.randomBytes(32).toString('hex');
        const dataToSign = `${value}.${sixteenMinutesAgo}`;
        const signature = crypto
            .createHmac('sha256', testSecret)
            .update(dataToSign)
            .digest('hex');
        const expiredState = `${dataToSign}.${signature}`;

        expect(isValidOAuthState(expiredState)).toBe(false);
    });

    it('rejects invalid or empty state inputs', () => {
        expect(isValidOAuthState('')).toBe(false);
        expect(isValidOAuthState(null)).toBe(false);
        expect(isValidOAuthState(undefined)).toBe(false);
        expect(isValidOAuthState('random_unformatted_string')).toBe(false);
        expect(isValidOAuthState('a.b.c.d')).toBe(false);
    });

    it('supports legacy 2-part format if unexpired', () => {
        const value = crypto.randomBytes(32).toString('hex');
        const signature = crypto
            .createHmac('sha256', testSecret)
            .update(value)
            .digest('hex');
        const legacyState = `${value}.${signature}`;
        expect(isValidOAuthState(legacyState)).toBe(true);
    });
});
