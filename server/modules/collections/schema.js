import { z } from 'zod';

export const collectionIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid collection ID format'),
});

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid deck ID in collection');

export const createCollectionSchema = z.object({
    name: z.string().trim().min(1, 'Collection name is required').max(100),
    deckIds: z.array(objectIdString).optional().default([]),
});

export const updateCollectionSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    deckIds: z.array(objectIdString).optional(),
});

export const listCollectionsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    cursor: z.string().optional(),
    paginate: z.enum(['true', 'false']).optional(),
});
