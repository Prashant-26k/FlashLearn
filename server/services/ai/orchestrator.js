import crypto from 'node:crypto';
import { aiConfig } from '../../config/ai.js';
import { buildGenerationPrompt } from './prompt.js';
import { parseFlashcardResponse } from './schema.js';
import { classifyProviderError } from './errors.js';
import { recordAIRequest } from '../telemetryService.js';
import { reserveProviderCall, recordGeneratedCards } from '../usageService.js';
import { runWithConcurrency } from '../../utils/concurrency.js';
import GeminiProvider from './providers/GeminiProvider.js';
import GroqProvider from './providers/GroqProvider.js';
import OpenRouterProvider from './providers/OpenRouterProvider.js';

const providers = new Map([
    ['gemini', new GeminiProvider()],
    ['groq', new GroqProvider()],
    ['openrouter', new OpenRouterProvider()],
]);

const health = new Map();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getHealth(name) {
    return health.get(name) || { failures: 0, cooldownUntil: 0, latencyMs: 0 };
}

function chooseProviders() {
    return aiConfig.providerOrder
        .map(name => providers.get(name))
        .filter(provider => provider?.isEnabled())
        .filter(provider => getHealth(provider.name).cooldownUntil <= Date.now())
        .sort((a, b) => {
            const ah = getHealth(a.name);
            const bh = getHealth(b.name);
            return (a.priority + ah.failures * 10 + ah.latencyMs / 1000)
                - (b.priority + bh.failures * 10 + bh.latencyMs / 1000);
        });
}

function updateHealth(provider, success, latencyMs, cooldownMs = 0) {
    const current = getHealth(provider.name);
    health.set(provider.name, success
        ? { failures: 0, cooldownUntil: 0, latencyMs }
        : {
            failures: current.failures + 1,
            cooldownUntil: Date.now() + Math.max(cooldownMs, Math.min(60000, 1000 * (2 ** current.failures))),
            latencyMs: current.latencyMs || latencyMs,
        });
}

async function tryProvider(provider, prompt, context) {
    const requestId = crypto.randomUUID();
    let retryCount = 0;
    let lastError;
    for (let attempt = 0; attempt <= aiConfig.retryAttempts; attempt += 1) {
        const startedAt = Date.now();
        let result;
        let parsed;
        try {
            await reserveProviderCall(context.userId);
            result = await provider.generate(prompt, { timeoutMs: aiConfig.requestTimeoutMs });
            parsed = parseFlashcardResponse(result.text);
        } catch (error) {
            if (error.code === 'USAGE_LIMIT_EXCEEDED') throw error;
            const classified = classifyProviderError(error);
            lastError = classified;
            const latencyMs = Date.now() - startedAt;
            if (!classified.retryable || attempt === aiConfig.retryAttempts) {
                updateHealth(provider, false, latencyMs, classified.retryAfterMs);
                await recordAIRequest({
                    requestId,
                    userId: context.userId,
                    provider: provider.name,
                    model: provider.model,
                    operation: context.operation,
                    status: 'failure',
                    latencyMs,
                    retryCount,
                    fallbackCount: context.fallbackCount,
                    errorType: classified.errorType,
                });
                break;
            }
            retryCount += 1;
            await sleep(Math.max(classified.retryAfterMs, 100 * (2 ** attempt) + Math.floor(Math.random() * 100)));
            continue;
        }
        const latencyMs = Date.now() - startedAt;
        updateHealth(provider, true, latencyMs);
        await recordGeneratedCards(context.userId, parsed.flashcards.length);
        await recordAIRequest({
            requestId,
            userId: context.userId,
            provider: provider.name,
            model: provider.model,
            operation: context.operation,
            status: 'success',
            latencyMs,
            retryCount,
            fallbackCount: context.fallbackCount,
            inputTokens: result.usage?.prompt_tokens || result.usage?.promptTokenCount || null,
            outputTokens: result.usage?.completion_tokens || result.usage?.candidatesTokenCount || null,
        });
        return parsed.flashcards;
    }
    throw lastError;
}

export async function generateCards({ text, maxCards, userId, operation }) {
    const selectedProviders = chooseProviders();
    if (!selectedProviders.length) {
        throw new Error('No AI providers are currently configured or available');
    }
    let lastError;
    for (let index = 0; index < selectedProviders.length; index += 1) {
        try {
            return await tryProvider(selectedProviders[index], buildGenerationPrompt(text, maxCards), {
                userId,
                operation,
                fallbackCount: index,
            });
        } catch (error) {
            if (error.code === 'USAGE_LIMIT_EXCEEDED') throw error;
            lastError = error;
        }
    }
    throw lastError;
}

export async function generateCardsFromChunks(chunks, context) {
    const results = await runWithConcurrency(
        chunks,
        aiConfig.maxConcurrentAiRequests,
        async (chunk) => {
            try {
                return { cards: await generateCards({
                    text: chunk,
                    maxCards: Math.min(5, context.maxCards),
                    userId: context.userId,
                    operation: 'generate_chunks',
                }), failed: false };
            } catch (error) {
                if (error.code === 'USAGE_LIMIT_EXCEEDED') throw error;
                return { cards: [], failed: true };
            }
        },
    );
    const cards = results.flatMap(result => result.cards);
    const failedChunks = results.filter(result => result.failed);
    return {
        cards: cards.slice(0, context.maxCards),
        warnings: failedChunks.length ? [{
            type: 'PARTIAL_GENERATION_FAILURE',
            failedChunks: failedChunks.length,
        }] : [],
    };
}
