import { quizService } from './service.js';

export const quizController = {
    async saveResult(req, res, next) {
        try {
            const result = await quizService.saveResult(req.body, req.user.userId);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    },

    async getHistory(req, res, next) {
        try {
            const { limit, cursor, paginate } = req.query;
            const result = await quizService.getHistory(req.user.userId, {
                limit: limit ? parseInt(limit, 10) : 20,
                cursor,
                paginate: paginate === 'true',
            });

            if (result.pagination.nextCursor) {
                res.setHeader('X-Next-Cursor', result.pagination.nextCursor);
            }
            res.setHeader('X-Total-Count', result.pagination.total);
            res.setHeader('X-Has-More', String(result.pagination.hasMore));

            if (paginate === 'true' || cursor) {
                return res.json(result);
            }

            res.json(result.items);
        } catch (err) {
            next(err);
        }
    },

    async getStats(req, res, next) {
        try {
            const tzOffsetMin = req.query.tzOffset !== undefined ? parseInt(req.query.tzOffset, 10) : undefined;
            const stats = await quizService.getStats(req.user.userId, tzOffsetMin);
            res.json(stats);
        } catch (err) {
            next(err);
        }
    }
};
