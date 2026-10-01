import { deckService } from './service.js';

export const deckController = {
    async getMenu(req, res, next) {
        try {
            const data = await deckService.getMenuData(req.user.userId);
            res.json(data);
        } catch (err) {
            next(err);
        }
    },

    async listDecks(req, res, next) {
        try {
            const { limit, cursor, sort, paginate } = req.query;
            const result = await deckService.listDecks(req.user.userId, {
                limit: limit ? parseInt(limit, 10) : 50,
                cursor,
                sort,
                paginate: paginate === 'true',
            });

            if (result.pagination.nextCursor) {
                res.setHeader('X-Next-Cursor', result.pagination.nextCursor);
            }
            res.setHeader('X-Total-Count', result.pagination.total);
            res.setHeader('X-Has-More', String(result.pagination.hasMore));

            // If paginate=true or cursor is supplied, return structured envelope.
            // Otherwise return items array for backward compatibility with frontend code.
            if (paginate === 'true' || cursor) {
                return res.json(result);
            }

            res.json(result.items);
        } catch (err) {
            next(err);
        }
    },

    async getDeck(req, res, next) {
        try {
            const deck = await deckService.getDeckById(req.params.id, req.user.userId);
            res.json(deck);
        } catch (err) {
            next(err);
        }
    },

    async createDeck(req, res, next) {
        try {
            const deck = await deckService.createDeck(req.body, req.user.userId);
            res.status(201).json(deck);
        } catch (err) {
            next(err);
        }
    },

    async updateDeck(req, res, next) {
        try {
            const deck = await deckService.updateDeck(req.params.id, req.body, req.user.userId);
            res.json(deck);
        } catch (err) {
            next(err);
        }
    },

    async toggleFavorite(req, res, next) {
        try {
            const result = await deckService.toggleFavorite(req.params.id, req.body?.favorite, req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    async recordVisit(req, res, next) {
        try {
            await deckService.recordVisit(req.params.id, req.user.userId);
            res.status(204).end();
        } catch (err) {
            next(err);
        }
    },

    async deleteDeck(req, res, next) {
        try {
            const result = await deckService.deleteDeck(req.params.id, req.user.userId);
            res.json(result);
        } catch (err) {
            next(err);
        }
    },
};
