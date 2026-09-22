import express from 'express';
import multer from 'multer';
import pdfParse from '../utils/pdfParser.js';
import mammoth from 'mammoth';
import { generateCardsFromText, generateCardsFromTopic } from '../services/gemini.js';
import { generateCardsFromChunks as orchestrateChunks } from '../services/ai/orchestrator.js';
import { chunkText } from '../utils/chunker.js';
import { generationRateLimiter } from '../middleware/rateLimiter.js';
import logger from '../utils/logger.js';
import { aiConfig } from '../config/ai.js';
import { reserveGeneration, UsageLimitError } from '../services/usageService.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: aiConfig.maxDocumentSizeMb * 1024 * 1024, files: 10 }
});

const MAX_TEXT_LENGTH = 15000;

function getUploadedFiles(req) {
    const files = [];

    if (req.file) files.push(req.file);

    if (req.files) {
        if (Array.isArray(req.files)) {
            files.push(...req.files);
        } else {
            if (Array.isArray(req.files.files)) files.push(...req.files.files);
            if (Array.isArray(req.files.file)) files.push(...req.files.file);
            if (req.files.file && !Array.isArray(req.files.file)) files.push(req.files.file);
        }
    }

    return files;
}

async function extractTextFromUploadedFile(file) {
    const mime = file.mimetype || '';
    const name = (file.originalname || '').toLowerCase();

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        const data = await pdfParse(file.buffer);
        return data.text || '';
    }

    if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        name.endsWith('.docx')
    ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value || '';
    }

    if (mime === 'text/plain' || name.endsWith('.txt') || mime.startsWith('text/')) {
        return file.buffer.toString('utf-8');
    }

    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
}

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

        await reserveGeneration(req.user.userId);
        const cards = await generateCardsFromText(text, req.user.userId);

        res.json({ cards });
    } catch (err) {
        if (err instanceof UsageLimitError) return res.status(err.status).json({ error: err.message });
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

        await reserveGeneration(req.user.userId);
        const cards = await generateCardsFromTopic(topic, req.user.userId);

        res.json({ cards });
    } catch (err) {
        if (err instanceof UsageLimitError) return res.status(err.status).json({ error: err.message });
        logger.error('Generate from topic error:', { error: err.message });
        res.status(500).json({ error: 'Failed to generate flashcards from topic' });
    }
});

// POST generate from uploaded file(s) (PDF, DOCX, or TXT)
router.post('/file', upload.fields([
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 1 }
]), async (req, res) => {
    try {
        const uploadedFiles = getUploadedFiles(req);

        if (!uploadedFiles.length) {
            return res.status(400).json({ error: 'File is required' });
        }

        const extractedSections = [];

        for (const file of uploadedFiles) {
            const text = await extractTextFromUploadedFile(file);
            if (text && text.trim()) {
                extractedSections.push(`Document: ${file.originalname}\n\n${text}`);
            }
        }

        const combinedText = extractedSections.join('\n\n---\n\n');

        if (!combinedText || !combinedText.trim()) {
            return res.status(400).json({ error: 'Could not extract text from the uploaded file(s) or the file(s) are empty' });
        }

        await reserveGeneration(req.user.userId);
        let cards = [];
        let warnings = [];
        if (combinedText.length > 3500) {
            // Use chunking pipeline for large document sets
            const chunks = chunkText(combinedText, 3000, aiConfig.maxChunksPerGeneration);
            const result = await orchestrateChunks(chunks, {
                userId: req.user.userId,
                maxCards: aiConfig.maxFlashcardsPerGeneration,
            });
            cards = result.cards;
            warnings = result.warnings;
        } else {
            cards = await generateCardsFromText(combinedText, req.user.userId);
        }

        res.json({ cards, warnings, fileCount: uploadedFiles.length });
    } catch (err) {
        if (err instanceof UsageLimitError) return res.status(err.status).json({ error: err.message });
        logger.error('Generate from file error:', {
            error: err.message,
            files: getUploadedFiles(req).map(file => file.originalname),
        });
        res.status(500).json({ error: err.message || 'Failed to generate flashcards from file' });
    }
});

export default router;
