import QuizResult from '../../models/QuizResult.js';
import { calculateQuizStats } from './stats.js';

export const quizService = {
    async saveResult(data, userId) {
        const result = new QuizResult({
            deckIds: data.deckIds || [],
            score: data.score,
            total: data.total,
            userId,
        });
        await result.save();
        return result;
    },

    async getHistory(userId, { limit = 20, cursor }) {
        const query = { userId };
        if (cursor) {
            query._id = { $lt: cursor };
        }

        const items = await QuizResult.find(query)
            .sort('-date')
            .limit(limit + 1)
            .lean();

        const hasMore = items.length > limit;
        const resultItems = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore && resultItems.length > 0 ? String(resultItems[resultItems.length - 1]._id) : null;
        const total = await QuizResult.countDocuments({ userId });

        return {
            items: resultItems,
            pagination: {
                limit,
                nextCursor,
                hasMore,
                total,
            }
        };
    },

    async getStats(userId, tzOffsetMin) {
        const results = await QuizResult.find({ userId }).sort('-date').lean();
        return calculateQuizStats(results, {
            now: new Date(),
            tzOffsetMin,
        });
    }
};
