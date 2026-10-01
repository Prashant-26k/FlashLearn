import express from 'express';
import { quizController } from './controller.js';
import validate from '../../middleware/validate.js';
import idempotency from '../../middleware/idempotency.js';
import {
    saveQuizResultSchema,
    quizStatsQuerySchema,
    quizHistoryQuerySchema,
} from './schema.js';

const router = express.Router();

router.post('/result', idempotency, validate({ body: saveQuizResultSchema }), quizController.saveResult);
router.get('/history', validate({ query: quizHistoryQuerySchema }), quizController.getHistory);
router.get('/stats', validate({ query: quizStatsQuerySchema }), quizController.getStats);

export default router;
