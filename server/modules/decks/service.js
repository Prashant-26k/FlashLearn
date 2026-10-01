import Deck from '../../models/Deck.js';
import DeckVisit from '../../models/DeckVisit.js';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors.js';

const startOfToday = () => {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
};

export const deckService = {
    async listDecks(userId, { limit = 50, cursor, sort = '-createdAt' }) {
        const query = { userId };

        if (cursor) {
            try {
                const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
                const [cursorCreatedAt, cursorId] = decodedCursor.split('_');
                if (cursorCreatedAt && cursorId) {
                    query.$or = [
                        { createdAt: { $lt: new Date(cursorCreatedAt) } },
                        { createdAt: new Date(cursorCreatedAt), _id: { $lt: cursorId } }
                    ];
                }
            } catch {
                // If invalid cursor, ignore and fetch top
            }
        }

        const items = await Deck.find(query)
            .sort(sort)
            .limit(limit + 1)
            .lean();

        const hasMore = items.length > limit;
        const resultItems = hasMore ? items.slice(0, limit) : items;

        let nextCursor = null;
        if (hasMore && resultItems.length > 0) {
            const lastItem = resultItems[resultItems.length - 1];
            nextCursor = Buffer.from(`${new Date(lastItem.createdAt).toISOString()}_${lastItem._id}`).toString('base64');
        }

        const total = await Deck.countDocuments({ userId });

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

    async getDeckById(deckId, userId) {
        const deck = await Deck.findById(deckId);
        if (!deck) {
            throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        }
        if (String(deck.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to view this deck');
        }
        return deck;
    },

    async createDeck(data, userId) {
        const deck = new Deck({
            title: data.title,
            topic: data.topic || 'General',
            cards: data.cards || [],
            userId,
            version: 1,
        });
        await deck.save();
        return deck;
    },

    async updateDeck(deckId, data, userId) {
        const deck = await Deck.findById(deckId);
        if (!deck) {
            throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        }
        if (String(deck.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to modify this deck');
        }

        // Section 6: Optimistic concurrency check
        if (data.version !== undefined && data.version !== null) {
            const currentVersion = deck.version || 1;
            if (data.version !== currentVersion) {
                throw new ConflictError(
                    'Deck was modified by another session. Please reload the latest version.',
                    'VERSION_CONFLICT',
                    { currentVersion, expectedVersion: data.version }
                );
            }
        }

        if (data.title !== undefined) deck.title = data.title;
        if (data.topic !== undefined) deck.topic = data.topic;
        if (data.cards !== undefined) deck.cards = data.cards;
        if (data.isFavorite !== undefined) deck.isFavorite = Boolean(data.isFavorite);

        // Increment version on every successful update
        deck.version = (deck.version || 1) + 1;
        deck.updatedAt = new Date();

        await deck.save();
        return deck;
    },

    async toggleFavorite(deckId, favoriteValue, userId) {
        const deck = await Deck.findById(deckId);
        if (!deck) {
            throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        }
        if (String(deck.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to modify this deck');
        }

        deck.isFavorite = favoriteValue === undefined ? !deck.isFavorite : Boolean(favoriteValue);
        deck.updatedAt = new Date();
        await deck.save();
        return { id: deck._id, isFavorite: deck.isFavorite, version: deck.version };
    },

    async recordVisit(deckId, userId) {
        const deck = await Deck.findById(deckId).select('_id userId');
        if (!deck) {
            throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        }
        if (String(deck.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to access this deck');
        }

        const day = startOfToday();
        await DeckVisit.findOneAndUpdate(
            { userId, deckId: deck._id, day },
            { $set: { visitedAt: new Date() } },
            { upsert: true, setDefaultsOnInsert: true },
        );
    },

    async deleteDeck(deckId, userId) {
        const deck = await Deck.findById(deckId);
        if (!deck) {
            throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        }
        if (String(deck.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to delete this deck');
        }

        await Deck.deleteOne({ _id: deckId });
        await DeckVisit.deleteMany({ deckId });
        return { message: 'Deck deleted successfully' };
    },

    async getMenuData(userId) {
        const day = startOfToday();
        const tomorrow = new Date(day);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const visits = await DeckVisit.find({
            userId,
            day,
        }).sort('-visitedAt').lean();

        const visitIds = visits.map((visit) => visit.deckId);
        const recentDecks = await Deck.find({
            userId,
            $or: [
                { createdAt: { $gte: day, $lt: tomorrow } },
                { _id: { $in: visitIds } },
            ],
        }).select('title topic createdAt isFavorite cards version').lean();

        const byId = new Map(recentDecks.map((deck) => [String(deck._id), deck]));
        const recent = [
            ...visits.map((visit) => byId.get(String(visit.deckId))).filter(Boolean),
            ...recentDecks.filter((deck) => !visitIds.some((id) => String(id) === String(deck._id))),
        ];

        const favoriteDecks = await Deck.find({ userId, isFavorite: true })
            .select('title topic createdAt isFavorite cards version')
            .sort('title')
            .lean();

        const mapDeckWithCount = (deck) => ({
            ...deck,
            cardCount: Array.isArray(deck.cards) ? deck.cards.length : 0,
        });

        return {
            favorites: favoriteDecks.map(mapDeckWithCount),
            recent: recent.map(mapDeckWithCount),
        };
    }
};
