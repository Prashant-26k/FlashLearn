/* global process */

const integer = (name, fallback, minimum = 0) => {
    const value = Number.parseInt(process.env[name] || '', 10);
    return Number.isFinite(value) && value >= minimum ? value : fallback;
};

export const aiConfig = {
    freeDailyGenerationLimit: integer('FREE_DAILY_GENERATION_LIMIT', 10, 1),
    globalDailyGenerationLimit: integer('GLOBAL_DAILY_GENERATION_LIMIT', 1000, 1),
    globalDailyAiRequestLimit: integer('GLOBAL_DAILY_AI_REQUEST_LIMIT', 3000, 1),
    maxFlashcardsPerGeneration: integer('MAX_FLASHCARDS_PER_GENERATION', 50, 1),
    maxDocumentSizeMb: integer('MAX_DOCUMENT_SIZE_MB', 10, 1),
    maxChunksPerGeneration: integer('MAX_CHUNKS_PER_GENERATION', 20, 1),
    maxConcurrentAiRequests: integer('MAX_CONCURRENT_AI_REQUESTS', 3, 1),
    telemetryRetentionDays: integer('AI_TELEMETRY_RETENTION_DAYS', 30, 1),
    providerOrder: (process.env.AI_PROVIDER_ORDER || 'gemini,groq,openrouter')
        .split(',')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean),
    retryAttempts: integer('AI_RETRY_ATTEMPTS', 2, 0),
    requestTimeoutMs: integer('AI_REQUEST_TIMEOUT_MS', 30000, 1000),
};

export const getUtcDateKey = (date = new Date()) => date.toISOString().slice(0, 10);
