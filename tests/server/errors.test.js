import { describe, it, expect } from 'vitest';
import {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ExternalServiceError,
    DatabaseError,
} from '../../server/utils/errors.js';

describe('Error Hierarchy', () => {
    it('instantiates ValidationError with 400 status and details', () => {
        const details = [{ field: 'title', message: 'Title is required' }];
        const err = new ValidationError('Invalid deck payload', details);
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.details).toEqual(details);
    });

    it('instantiates AuthenticationError with 401 status', () => {
        const err = new AuthenticationError();
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('instantiates AuthorizationError with 403 status', () => {
        const err = new AuthorizationError();
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('FORBIDDEN');
    });

    it('instantiates NotFoundError with 404 status', () => {
        const err = new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe('DECK_NOT_FOUND');
    });

    it('instantiates ConflictError with 409 status', () => {
        const err = new ConflictError('Deck was modified', 'VERSION_CONFLICT', { currentVersion: 2 });
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe('VERSION_CONFLICT');
        expect(err.details.currentVersion).toBe(2);
    });

    it('instantiates RateLimitError with 429 status', () => {
        const err = new RateLimitError();
        expect(err.statusCode).toBe(429);
        expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('instantiates ExternalServiceError with 502 status', () => {
        const err = new ExternalServiceError('AI provider down');
        expect(err.statusCode).toBe(502);
        expect(err.code).toBe('EXTERNAL_SERVICE_ERROR');
    });

    it('instantiates DatabaseError with 500 status', () => {
        const err = new DatabaseError('Connection lost');
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe('DATABASE_ERROR');
    });
});
