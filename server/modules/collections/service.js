import Collection from '../../models/Collection.js';
import { NotFoundError, AuthorizationError } from '../../utils/errors.js';

export const collectionService = {
    async listCollections(userId, { limit = 50, cursor }) {
        const query = { userId };
        if (cursor) {
            query._id = { $lt: cursor };
        }

        const items = await Collection.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .lean();

        const hasMore = items.length > limit;
        const resultItems = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore && resultItems.length > 0 ? String(resultItems[resultItems.length - 1]._id) : null;
        const total = await Collection.countDocuments({ userId });

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

    async getCollectionById(id, userId) {
        const col = await Collection.findById(id);
        if (!col) {
            throw new NotFoundError('Collection not found', 'COLLECTION_NOT_FOUND');
        }
        if (String(col.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to view this collection');
        }
        return col;
    },

    async createCollection(data, userId) {
        const col = new Collection({
            name: data.name,
            deckIds: data.deckIds || [],
            userId,
        });
        await col.save();
        return col;
    },

    async updateCollection(id, data, userId) {
        const col = await Collection.findById(id);
        if (!col) {
            throw new NotFoundError('Collection not found', 'COLLECTION_NOT_FOUND');
        }
        if (String(col.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to modify this collection');
        }

        if (data.name !== undefined) col.name = data.name;
        if (data.deckIds !== undefined) col.deckIds = data.deckIds;
        await col.save();
        return col;
    },

    async deleteCollection(id, userId) {
        const col = await Collection.findById(id);
        if (!col) {
            throw new NotFoundError('Collection not found', 'COLLECTION_NOT_FOUND');
        }
        if (String(col.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to delete this collection');
        }

        await Collection.deleteOne({ _id: id });
        return { message: 'Collection deleted' };
    }
};
