import express from 'express';
import Collection from '../models/Collection.js';

const router = express.Router();

// GET all collections
router.get('/', async (req, res) => {
    try {
        const { limit } = req.query;
        let query = Collection.find({ userId: req.user.userId });
        if (limit) query = query.limit(parseInt(limit));
        const collections = await query;
        res.json(collections);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

// POST create collection
router.post('/', async (req, res) => {
    try {
        const { name, deckIds } = req.body;
        const collection = new Collection({
            name,
            deckIds: deckIds || [],
            userId: req.user.userId,
        });
        await collection.save();
        res.status(201).json(collection);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

// PUT update collection
router.put('/:id', async (req, res) => {
    try {
        const col = await Collection.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!col) return res.status(404).json({ error: 'Collection not found' });
        const { name, deckIds } = req.body;
        if (name !== undefined) col.name = name;
        if (deckIds !== undefined) col.deckIds = deckIds;
        await col.save();
        res.json(col);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

// DELETE collection
router.delete('/:id', async (req, res) => {
    try {
        const result = await Collection.deleteOne({ _id: req.params.id, userId: req.user.userId });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Collection not found' });
        res.json({ message: 'Collection deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});

export default router;

// import express from 'express';
// import Collection from '../models/Collection.js';

// const router = express.Router();

// // GET all collections
// router.get('/', async (req, res) => {
//     try {
//         const { limit } = req.query;
//         let query = Collection.find({ userId: req.user.userId });
//         if (limit) query = query.limit(parseInt(limit));
//         const collections = await query;
//         res.json(collections);
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to fetch collections' });
//     }
// });

// // POST create collection
// router.post('/', async (req, res) => {
//     try {
//         const { name, deckIds } = req.body;
//         const collection = new Collection({
//             name,
//             deckIds: deckIds || [],
//             userId: req.user.userId,
//         });
//         await collection.save();
//         res.status(201).json(collection);
//     } catch (err) {
//         console.error('POST /collections error:', err);
//         res.status(500).json({ error: 'Failed to create collection', detail: err.message });
//     }
// });

// // PUT update collection
// router.put('/:id', async (req, res) => {
//     try {
//         const col = await Collection.findOne({ _id: req.params.id, userId: req.user.userId });
//         if (!col) return res.status(404).json({ error: 'Collection not found' });
//         const { name, deckIds } = req.body;
//         if (name !== undefined) col.name = name;
//         if (deckIds !== undefined) col.deckIds = deckIds;
//         await col.save();
//         res.json(col);
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to update collection' });
//     }
// });

// // DELETE collection
// router.delete('/:id', async (req, res) => {
//     try {
//         const result = await Collection.deleteOne({ _id: req.params.id, userId: req.user.userId });
//         if (result.deletedCount === 0) return res.status(404).json({ error: 'Collection not found' });
//         res.json({ message: 'Collection deleted' });
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to delete collection' });
//     }
// });

// export default router;