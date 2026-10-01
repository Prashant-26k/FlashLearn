import { z } from 'zod';

export const exportDeckIdParamSchema = z.object({
    deckId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid deck ID format'),
});
