import { z } from 'zod';

export const deckIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid deck ID format'),
});

const cardItemSchema = z.object({
    question: z.string().trim().min(1, 'Card question cannot be empty'),
    answer: z.string().trim().min(1, 'Card answer cannot be empty'),
    dueAt: z.union([z.string(), z.date()]).optional(),
    intervalDays: z.number().optional(),
    repetitions: z.number().optional(),
    lapses: z.number().optional(),
    easeFactor: z.number().optional(),
    lastReviewedAt: z.union([z.string(), z.date()]).nullable().optional(),
});

export const createDeckSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    topic: z.string().trim().max(100).optional().default('General'),
    cards: z.array(cardItemSchema).optional().default([]),
});

export const updateDeckSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    topic: z.string().trim().max(100).optional(),
    cards: z.array(cardItemSchema).optional(),
    isFavorite: z.boolean().optional(),
    version: z.number().int().positive().optional(),
});

export const favoriteDeckSchema = z.object({
    favorite: z.boolean().optional(),
});

export const listDecksQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    cursor: z.string().optional(),
    sort: z.string().optional(),
    paginate: z.enum(['true', 'false']).optional(),
});
