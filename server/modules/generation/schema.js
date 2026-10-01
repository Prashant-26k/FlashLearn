import { z } from 'zod';

export const generateTextSchema = z.object({
    text: z.string().trim().min(1, 'Text is required').max(15000, 'Text exceeds maximum length of 15000 characters'),
});

export const generateTopicSchema = z.object({
    topic: z.string().trim().min(1, 'Topic is required').max(500, 'Topic exceeds maximum length'),
});
