import express from 'express';
import { deckController } from './controller.js';
import validate from '../../middleware/validate.js';
import idempotency from '../../middleware/idempotency.js';
import {
    deckIdParamSchema,
    createDeckSchema,
    updateDeckSchema,
    favoriteDeckSchema,
    listDecksQuerySchema,
} from './schema.js';

const router = express.Router();

router.get('/menu', deckController.getMenu);
router.get('/', validate({ query: listDecksQuerySchema }), deckController.listDecks);
router.get('/:id', validate({ params: deckIdParamSchema }), deckController.getDeck);
router.post('/', idempotency, validate({ body: createDeckSchema }), deckController.createDeck);
router.put('/:id', idempotency, validate({ params: deckIdParamSchema, body: updateDeckSchema }), deckController.updateDeck);
router.put('/:id/favorite', validate({ params: deckIdParamSchema, body: favoriteDeckSchema }), deckController.toggleFavorite);
router.post('/:id/visit', validate({ params: deckIdParamSchema }), deckController.recordVisit);
router.delete('/:id', validate({ params: deckIdParamSchema }), deckController.deleteDeck);

export default router;
