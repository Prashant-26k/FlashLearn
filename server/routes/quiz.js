import express from 'express';
import QuizResult from '../models/QuizResult.js';

const router = express.Router();

// POST save quiz result
router.post('/result', async (req, res) => {
    try {
        const { deckIds, score, total } = req.body;
        const result = new QuizResult({
            deckIds: deckIds || [],
            score,
            total,
            userId: req.user.userId,
        });
        await result.save();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
});

// GET quiz history
router.get('/history', async (req, res) => {
    try {
        const results = await QuizResult.find({ userId: req.user.userId })
            .sort('-date')
            .limit(20);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch quiz history' });
    }
});

export default router;
