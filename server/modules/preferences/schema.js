import { z } from 'zod';

export const patchPreferencesSchema = z.object({
    learningStyle: z.enum(['sequential', 'spaced'], {
        errorMap: () => ({ message: 'Invalid learning style. Must be "sequential" or "spaced"' }),
    }),
});
