import express from 'express';
import { exportController } from './controller.js';
import validate from '../../middleware/validate.js';
import { exportDeckIdParamSchema } from './schema.js';

const router = express.Router();

router.get('/:deckId', validate({ params: exportDeckIdParamSchema }), exportController.exportDeck);

export default router;
