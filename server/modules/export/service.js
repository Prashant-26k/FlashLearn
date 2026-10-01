import Deck from '../../models/Deck.js';
import { NotFoundError, AuthorizationError } from '../../utils/errors.js';

export const exportService = {
    async exportDeckAsText(deckId, userId) {
        const deck = await Deck.findById(deckId);
        if (!deck) {
            throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND');
        }
        if (String(deck.userId) !== String(userId)) {
            throw new AuthorizationError('You do not have permission to export this deck');
        }

        let content = `${deck.title}\n`;
        content += `Topic: ${deck.topic || 'General'}\n`;
        content += `${'='.repeat(40)}\n\n`;

        const cards = deck.cards || [];
        cards.forEach((card, i) => {
            content += `${i + 1}. Q: ${card.question}\n`;
            content += `   A: ${card.answer}\n\n`;
        });

        content += `\nTotal: ${cards.length} cards\n`;
        content += `Exported from FlashLearn\n`;

        return {
            filename: `${deck.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`,
            content,
        };
    }
};
