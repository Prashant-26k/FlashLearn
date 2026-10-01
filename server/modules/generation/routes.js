import express from 'express';
import multer from 'multer';
import { generationController } from './controller.js';
import validate from '../../middleware/validate.js';
import idempotency from '../../middleware/idempotency.js';
import { generationRateLimiter } from '../../middleware/rateLimiter.js';
import { aiConfig } from '../../config/ai.js';
import { generateTextSchema, generateTopicSchema } from './schema.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: aiConfig.maxDocumentSizeMb * 1024 * 1024, files: 10 }
});

router.use(generationRateLimiter);

router.post('/text', idempotency, validate({ body: generateTextSchema }), generationController.generateFromText);
router.post('/topic', idempotency, validate({ body: generateTopicSchema }), generationController.generateFromTopic);
router.post('/file', idempotency, upload.fields([
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 1 }
]), generationController.generateFromFile);

export default router;
