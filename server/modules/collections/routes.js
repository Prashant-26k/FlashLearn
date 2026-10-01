import express from 'express';
import { collectionController } from './controller.js';
import validate from '../../middleware/validate.js';
import idempotency from '../../middleware/idempotency.js';
import {
    collectionIdParamSchema,
    createCollectionSchema,
    updateCollectionSchema,
    listCollectionsQuerySchema,
} from './schema.js';

const router = express.Router();

router.get('/', validate({ query: listCollectionsQuerySchema }), collectionController.listCollections);
router.get('/:id', validate({ params: collectionIdParamSchema }), collectionController.getCollection);
router.post('/', idempotency, validate({ body: createCollectionSchema }), collectionController.createCollection);
router.put('/:id', idempotency, validate({ params: collectionIdParamSchema, body: updateCollectionSchema }), collectionController.updateCollection);
router.delete('/:id', validate({ params: collectionIdParamSchema }), collectionController.deleteCollection);

export default router;
