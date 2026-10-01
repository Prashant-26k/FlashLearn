import { z } from 'zod';

export const loginQuerySchema = z.object({
    error: z.string().optional(),
    state: z.string().optional(),
    code: z.string().optional(),
}).passthrough();
