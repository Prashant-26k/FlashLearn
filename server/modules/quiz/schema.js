import { z } from 'zod';

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid deck ID in quiz result');

export const saveQuizResultSchema = z.object({
    deckIds: z.array(objectIdString).optional().default([]),
    score: z.number().int().min(0, 'Score must be non-negative'),
    total: z.number().int().positive('Total questions must be greater than zero'),
}).refine(data => data.score <= data.total, {
    message: 'Score cannot exceed total questions',
    path: ['score'],
});

export const quizStatsQuerySchema = z.object({
    tzOffset: z.coerce.number().optional(),
});

export const quizHistoryQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    cursor: z.string().optional(),
    paginate: z.enum(['true', 'false']).optional(),
});
