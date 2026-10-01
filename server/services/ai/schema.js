import { z } from 'zod';

const cardSchema = z.object({
    question: z.string().trim().min(1, 'Flashcard question cannot be empty'),
    answer: z.string().trim().min(1, 'Flashcard answer cannot be empty'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    topic: z.string().trim().min(1).optional(),
}).strict();

export const flashcardResponseSchema = z.object({
    flashcards: z.array(cardSchema),
}).strict();

export function parseFlashcardResponse(rawText) {
    const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    const parsed = JSON.parse(cleaned);
    const candidate = Array.isArray(parsed) ? { flashcards: parsed } : parsed;
    const response = flashcardResponseSchema.parse(candidate);
    const seen = new Set();
    const flashcards = response.flashcards.filter((card) => {
        const key = `${card.question.toLowerCase()}::${card.answer.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    return { flashcards };
}
