import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../server/index.js';

describe('Express API Integration Tests', () => {
    let testToken;
    const testUserId = '507f1f77bcf86cd799439011';

    beforeAll(async () => {
        const secret = process.env.JWT_SECRET || 'dev_secret_key_at_least_16_characters_long';
        testToken = jwt.sign(
            {
                userId: testUserId,
                email: 'tester@flashlearn.app',
                displayName: 'Test User',
            },
            secret,
            { expiresIn: '1h' }
        );

        const mongoUri = process.env.MONGODB_URI;
        if (mongoUri && mongoose.connection.readyState === 0) {
            try {
                await mongoose.connect(mongoUri);
            } catch {
                mongoose.set('bufferCommands', false);
            }
        } else if (mongoose.connection.readyState === 0) {
            mongoose.set('bufferCommands', false);
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });

    describe('Health & Observability Endpoints', () => {
        it('GET /health/live returns 200 alive', async () => {
            const res = await request(app).get('/health/live');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('alive');
            expect(res.headers['x-request-id']).toBeDefined();
        });

        it('GET /health/ready returns readiness payload', async () => {
            const res = await request(app).get('/health/ready');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ready');
        });

        it('GET /api/health returns legacy 200 ok', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });

        it('GET /api/v1/metrics returns observability stats', async () => {
            const res = await request(app).get('/api/v1/metrics');
            expect(res.status).toBe(200);
            expect(res.body.http).toBeDefined();
            expect(res.body.ai).toBeDefined();
        });
    });

    describe('Authentication & Authorization Security', () => {
        it('rejects protected endpoints without token with standard error response', async () => {
            const res = await request(app).get('/api/v1/decks');
            expect(res.status).toBe(401);
            expect(res.body.error).toBeDefined();
            expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
            expect(res.body.error.requestId).toBeDefined();
        });

        it('accepts valid Bearer token for GET /api/decks and returns 200 array', async () => {
            const res = await request(app)
                .get('/api/decks')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.headers['x-request-id']).toBeDefined();
        });

        it('accepts valid query params for GET /api/quiz/stats and returns 200 object', async () => {
            const res = await request(app)
                .get('/api/quiz/stats?tzOffset=-330')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.status).toBe(200);
            expect(res.body.quizzesTaken).toBeDefined();
            expect(res.headers['x-request-id']).toBeDefined();
        });

        it('accepts authentication via HttpOnly cookie', async () => {
            const res = await request(app)
                .get('/api/decks')
                .set('Cookie', [`flashlearn_token=${testToken}`]);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('Input Validation & Centralized Error Format', () => {
        it('rejects invalid deck ID parameter with 400 VALIDATION_ERROR', async () => {
            const res = await request(app)
                .get('/api/v1/decks/not-a-valid-hex-id')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
            expect(res.body.error.details).toBeDefined();
        });

        it('rejects empty title when creating deck with 400 VALIDATION_ERROR', async () => {
            const res = await request(app)
                .post('/api/v1/decks')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ title: '', cards: [] });
            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('API Versioning (Section 15)', () => {
        it('routes /api/decks and /api/v1/decks to the same handler', async () => {
            const resV1 = await request(app)
                .get('/api/v1/decks/not-a-valid-hex-id')
                .set('Authorization', `Bearer ${testToken}`);

            const resLegacy = await request(app)
                .get('/api/decks/not-a-valid-hex-id')
                .set('Authorization', `Bearer ${testToken}`);

            expect(resV1.status).toBe(resLegacy.status);
            expect(resV1.body.error.code).toBe(resLegacy.body.error.code);
        });
    });
});
