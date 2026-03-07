import express from 'express';
import Deck from '../models/Deck.js';

const router = express.Router();

// GET export deck as .txt
router.get('/:deckId', async (req, res) => {
    try {
        const deck = await Deck.findOne({ _id: req.params.deckId, userId: req.user.userId });
        if (!deck) return res.status(404).json({ error: 'Deck not found' });

        let content = `${deck.title}\n`;
        content += `Topic: ${deck.topic || 'General'}\n`;
        content += `${'='.repeat(40)}\n\n`;

        deck.cards.forEach((card, i) => {
            content += `${i + 1}. Q: ${card.question}\n`;
            content += `   A: ${card.answer}\n\n`;
        });

        content += `\nTotal: ${deck.cards.length} cards\n`;
        content += `Exported from FlashLearn`;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${deck.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`);
        res.send(content);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export deck' });
    }
});

export default router;
