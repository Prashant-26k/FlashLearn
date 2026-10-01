import { collectionService } from './service.js';

export const collectionController = {
    async listCollections(req, res, next) {
        try {
            const { limit, cursor, paginate } = req.query;
            const result = await collectionService.listCollections(req.user.userId, {
                limit: limit ? parseInt(limit, 10) : 50,
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

    async getCollection(req, res, next) {
        try {
            const col = await collectionService.getCollectionById(req.params.id, req.user.userId);
            res.json(col);
        } catch (err) {
            next(err);
        }
    },

    async createCollection(req, res, next) {
        try {
            const col = await collectionService.createCollection(req.body, req.user.userId);
            res.status(201).json(col);
        } catch (err) {
            next(err);
        }
    },

    async updateCollection(req, res, next) {
        try {
            const col = await collectionService.updateCollection(req.params.id, req.body, req.user.userId);
            res.json(col);
        } catch (err) {
            next(err);
        }
    },

    async deleteCollection(req, res, next) {
        try {
            const result = await collectionService.deleteCollection(req.params.id, req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },
};
