import UserUsage from '../models/UserUsage.js';
import GlobalUsage from '../models/GlobalUsage.js';
import { aiConfig, getUtcDateKey } from '../config/ai.js';
import { RateLimitError } from '../utils/errors.js';

export const ReservationState = {
    RESERVED: 'RESERVED',
    PROCESSING: 'PROCESSING',
    SUCCEEDED: 'SUCCEEDED',
    FAILED: 'FAILED',
    RELEASED: 'RELEASED',
};

export class UsageLimitError extends RateLimitError {
    constructor(message = 'Daily usage limit exceeded') {
        super(message);
        this.code = 'USAGE_LIMIT_EXCEEDED';
    }
}

async function atomicIncrement(Model, filter, increment, limit, label) {
    try {
        const result = await Model.findOneAndUpdate(
            { ...filter, [label]: { $lt: limit } },
            { $inc: { [label]: increment }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        if (!result) throw new UsageLimitError(`Daily ${label} limit reached`);
        return result;
    } catch (error) {
        if (error.code === 11000) {
            const result = await Model.findOneAndUpdate(
                { ...filter, [label]: { $lt: limit } },
                { $inc: { [label]: increment } },
                { new: true },
            );
            if (result) return result;
        }
        throw error;
    }
}

export async function reserveGeneration(userId) {
    const date = getUtcDateKey();
    await atomicIncrement(
        GlobalUsage,
        { date },
        1,
        aiConfig.globalDailyGenerationLimit,
        'generationRequests',
    );
    try {
        await atomicIncrement(
            UserUsage,
            { userId, date },
            1,
            aiConfig.freeDailyGenerationLimit,
            'generationRequests',
        );
        return {
            state: ReservationState.RESERVED,
            userId,
            date,
        };
    } catch (error) {
        await GlobalUsage.findOneAndUpdate({ date }, { $inc: { generationRequests: -1 } });
        throw error;
    }
}

export async function releaseGeneration(userId) {
    if (!userId) return;
    const date = getUtcDateKey();
    try {
        await Promise.all([
            GlobalUsage.findOneAndUpdate(
                { date, generationRequests: { $gt: 0 } },
                { $inc: { generationRequests: -1 } }
            ),
            UserUsage.findOneAndUpdate(
                { userId, date, generationRequests: { $gt: 0 } },
                { $inc: { generationRequests: -1 } }
            ),
        ]);
    } catch {
        // Suppress release failure to prevent crashing user response
    }
}

export async function reserveProviderCall(userId) {
    const date = getUtcDateKey();
    await atomicIncrement(GlobalUsage, { date }, 1, aiConfig.globalDailyAiRequestLimit, 'providerCalls');
    try {
        await UserUsage.findOneAndUpdate(
            { userId, date },
            { $inc: { providerCalls: 1 }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    } catch (error) {
        await GlobalUsage.findOneAndUpdate({ date }, { $inc: { providerCalls: -1 } });
        throw error;
    }
}

export async function recordGeneratedCards(userId, flashcardsGenerated) {
    const date = getUtcDateKey();
    await UserUsage.findOneAndUpdate(
        { userId, date },
        { $inc: { flashcardsGenerated } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );
}
