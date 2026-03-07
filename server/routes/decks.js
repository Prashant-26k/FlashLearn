import express from 'express';
import Deck from '../models/Deck.js';

const router = express.Router();

// GET all decks for current user
router.get('/', async (req, res) => {
    try {
        const { limit, sort } = req.query;
        let query = Deck.find({ userId: req.user.userId });
        query = sort ? query.sort(sort) : query.sort('-createdAt');
        if (limit) query = query.limit(parseInt(limit));
        const decks = await query;
        res.json(decks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch decks' });
    }
});

// GET single deck
router.get('/:id', async (req, res) => {
    try {
        const deck = await Deck.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!deck) return res.status(404).json({ error: 'Deck not found' });
        res.json(deck);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch deck' });
    }
});

// POST create deck
router.post('/', async (req, res) => {
    try {
        const { title, topic, cards } = req.body;
        const deck = new Deck({
            title,
            topic: topic || 'General',
            cards: cards || [],
            userId: req.user.userId,
        });
        await deck.save();
        res.status(201).json(deck);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create deck' });
    }
});

// PUT update deck
router.put('/:id', async (req, res) => {
    try {
        const deck = await Deck.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!deck) return res.status(404).json({ error: 'Deck not found' });
        const { title, topic, cards } = req.body;
        if (title !== undefined) deck.title = title;
        if (topic !== undefined) deck.topic = topic;
        if (cards !== undefined) deck.cards = cards;
        await deck.save();
        res.json(deck);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update deck' });
    }
});

// DELETE deck
router.delete('/:id', async (req, res) => {
    try {
        const result = await Deck.deleteOne({ _id: req.params.id, userId: req.user.userId });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Deck not found' });
        res.json({ message: 'Deck deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete deck' });
    }
});

export default router;
