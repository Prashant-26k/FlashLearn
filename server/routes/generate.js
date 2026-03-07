import express from 'express';
import multer from 'multer';
import pdfParse from '../utils/pdfParser.js';
import mammoth from 'mammoth';
import { generateCardsFromText, generateCardsFromTopic, generateCardsFromChunks } from '../services/gemini.js';
import { chunkText } from '../utils/chunker.js';
import { generationRateLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const MAX_TEXT_LENGTH = 15000;

// Apply rate limiting to all generation routes
router.use(generationRateLimiter);

// POST generate from pasted text
router.post('/text', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.` });
        }

        const cards = await generateCardsFromText(text);

        // Track usage if user is authenticated
        if (req.user) {
            await User.findByIdAndUpdate(req.user.id, { $inc: { generationCount: 1 } });
        }

        res.json({ cards });
    } catch (err) {
        logger.error('Generate from text error:', { error: err.message });
        res.status(500).json({ error: 'Failed to generate flashcards from text' });
    }
});

// POST generate from topic
router.post('/topic', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic || !topic.trim()) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const cards = await generateCardsFromTopic(topic);

        if (req.user) {
            await User.findByIdAndUpdate(req.user.id, { $inc: { generationCount: 1 } });
        }

        res.json({ cards });
    } catch (err) {
        logger.error('Generate from topic error:', { error: err.message, topic });
        res.status(500).json({ error: 'Failed to generate flashcards from topic' });
    }
});

// POST generate from uploaded file (PDF or DOCX)
router.post('/file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        let text = '';
        const mime = req.file.mimetype;
        const name = req.file.originalname.toLowerCase();

        if (mime === 'application/pdf' || name.endsWith('.pdf')) {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        } else if (
            mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            name.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Could not extract text from file or file is empty' });
        }

        let cards = [];
        if (text.length > 3500) {
            // Use chunking pipeline for large documents
            const chunks = chunkText(text);
            cards = await generateCardsFromChunks(chunks);
        } else {
            cards = await generateCardsFromText(text);
        }

        if (req.user) {
            await User.findByIdAndUpdate(req.user.id, { $inc: { generationCount: 1 } });
        }

        res.json({ cards });
    } catch (err) {
        logger.error('Generate from file error:', { error: err.message, file: req.file?.originalname });
        res.status(500).json({ error: 'Failed to generate flashcards from file' });
    }
});

export default router;
