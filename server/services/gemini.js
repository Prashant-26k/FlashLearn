import { aiConfig } from '../config/ai.js';
import { generateCards, generateCardsFromChunks as orchestrateChunks } from './ai/orchestrator.js';

export async function generateCardsFromText(text, userId = null) {
    return generateCards({
        text: text.substring(0, 15000),
        maxCards: aiConfig.maxFlashcardsPerGeneration,
        userId,
        operation: 'generate_text',
    });
}

export async function generateCardsFromChunks(chunks, userId = null) {
    return (await orchestrateChunks(chunks, {
        userId,
        maxCards: aiConfig.maxFlashcardsPerGeneration,
    })).cards;
}

export async function generateCardsFromTopic(topic, userId = null) {
    return generateCards({
        text: `Create educational flashcards about this topic: ${topic}`,
        maxCards: aiConfig.maxFlashcardsPerGeneration,
        userId,
        operation: 'generate_topic',
    });
}
