import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

let genAI = null;

function getGenAI() {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

// Use gemini-3.6-flash — the current stable recommended model.
// gemini-1.5-flash and gemini-2.0-flash are both deprecated/removed.
// gemini-2.5-flash enables thinking by default in SDK 0.24.x, causing
// response.text() to throw when thought blocks are present (500 errors).
const MODEL_NAME = 'gemini-3.6-flash';

const FLASHCARD_RULES = `
Rules for flashcards:
- Each flashcard must include: "question" and "answer".
- Focus on important concepts, definitions, and key facts.
- Avoid trivial facts or overly long explanations.
- Questions should be specific and clear.
- Answers should be concise but complete.
- Language should be professional and educational.
`;

const JSON_FORMAT_INSTRUCTION = `
Return ONLY a valid JSON array of objects with "question" and "answer" fields.
Do not include any other text, markdown, or explanation. Just the JSON array.

Example:
[
  {
    "question": "What is the capital of France?",
    "answer": "Paris"
  }
]
`;

/**
 * Safely extracts and parses JSON from a Gemini response string.
 * Strips markdown fences and leading/trailing whitespace before parsing.
 */
function parseCardsFromResponse(responseText) {
    const cleaned = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
    const cards = JSON.parse(cleaned);
    if (!Array.isArray(cards)) throw new Error('AI returned invalid format — expected a JSON array');
    return cards.filter(c => c.question && c.answer);
}

export async function generateCardsFromText(text) {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are a flashcard generator. From the following study material, generate flashcards.
${FLASHCARD_RULES}
Generate maximum 20 flashcards.
${JSON_FORMAT_INSTRUCTION}

Study material:
${text.substring(0, 15000)}`;

    try {
        const result = await model.generateContent(prompt);
        const filteredCards = parseCardsFromResponse(result.response.text());
        logger.info(`Generated ${filteredCards.length} cards from text`, {
            textLength: text.length,
            cardCount: filteredCards.length
        });
        return filteredCards;
    } catch (err) {
        logger.error('Gemini generation error (text):', { error: err.message, stack: err.stack });
        throw err;
    }
}

export async function generateCardsFromChunks(chunks) {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const chunkRequests = chunks.map(async (chunk, index) => {
        const prompt = `You are a flashcard generator. From the following section of study material, generate flashcards.
${FLASHCARD_RULES}
Generate maximum 5 flashcards for this specific section.
${JSON_FORMAT_INSTRUCTION}

Study material section ${index + 1}:
${chunk}`;

        try {
            const result = await model.generateContent(prompt);
            return parseCardsFromResponse(result.response.text());
        } catch (err) {
            logger.warn(`Failed to generate cards for chunk ${index}:`, { error: err.message });
            return [];
        }
    });

    const results = await Promise.all(chunkRequests);
    const mergedCards = results.flat().filter(c => c.question && c.answer);
    const finalCards = mergedCards.slice(0, 50); // Hard limit for merged results

    logger.info(`Generated ${finalCards.length} cards from ${chunks.length} chunks`, {
        chunkCount: chunks.length,
        totalCards: finalCards.length
    });

    return finalCards;
}

export async function generateCardsFromTopic(topic) {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are a flashcard generator. Create 10-15 educational flashcards about the topic: "${topic}".
${FLASHCARD_RULES}
${JSON_FORMAT_INSTRUCTION}`;

    try {
        const result = await model.generateContent(prompt);
        const filteredCards = parseCardsFromResponse(result.response.text());
        logger.info(`Generated ${filteredCards.length} cards for topic: ${topic}`);
        return filteredCards;
    } catch (err) {
        logger.error('Gemini generation error (topic):', { error: err.message, topic });
        throw err;
    }
}
